import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { prisma } from "@socialsphear/db";
import { SocialAccountsService } from "../social-accounts/social-accounts.service";
import { NotificationsService } from "../notifications/notifications.service";
import { InstagramPublisher } from "./adapters/instagram.publisher";
import { TwitterPublisher } from "./adapters/twitter.publisher";
import { LinkedInPublisher } from "./adapters/linkedin.publisher";
import { FacebookPublisher } from "./adapters/facebook.publisher";
import { TikTokPublisher } from "./adapters/tiktok.publisher";
import { PlatformPublisher } from "./adapters/platform-publisher.interface";

@Processor("post_publish")
export class PublisherProcessor extends WorkerHost {
  private readonly logger = new Logger(PublisherProcessor.name);

  constructor(
    private readonly socialAccountsService: SocialAccountsService,
    private readonly notificationsService: NotificationsService,
    private readonly instagramPublisher: InstagramPublisher,
    private readonly twitterPublisher: TwitterPublisher,
    private readonly linkedInPublisher: LinkedInPublisher,
    private readonly facebookPublisher: FacebookPublisher,
    private readonly tiktokPublisher: TikTokPublisher
  ) {
    super();
  }

  /**
   * Main entry point for executing scheduled post jobs from BullMQ
   */
  async process(job: Job<{ postId: string }>): Promise<any> {
    const { postId } = job.data;
    this.logger.log(`Processing post publication job for post ID: ${postId}`);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        postJobs: {
          include: {
            socialAccount: true,
          },
        },
      },
    });

    if (!post) {
      this.logger.warn(`Post with ID ${postId} not found. Skipping.`);
      return;
    }

    // Update post status to publishing
    await prisma.post.update({
      where: { id: postId },
      data: { status: "publishing" },
    });

    let overallSuccess = true;
    const errors: string[] = [];

    for (const postJob of post.postJobs) {
      if (postJob.status === "published") {
        continue; // Already published, skip (idempotency)
      }

      await prisma.postJob.update({
        where: { id: postJob.id },
        data: { status: "publishing" },
      });

      try {
        const decryptedToken = await this.socialAccountsService.getDecryptedAccessToken(
          postJob.socialAccountId
        );

        const publisher = this.getPublisherForPlatform(postJob.platform);
        if (!publisher) {
          throw new Error(`Unsupported publishing platform: ${postJob.platform}`);
        }

        const result = await publisher.publish(
          postJob,
          postJob.socialAccount,
          post,
          decryptedToken
        );

        if (result.success) {
          await prisma.postJob.update({
            where: { id: postJob.id },
            data: {
              status: "published",
              platformPostId: result.platformPostId,
              platformUrl: result.platformUrl,
              publishedAt: new Date(),
              retryCount: postJob.retryCount + (job.attemptsMade || 0),
            },
          });
          
          // Send real-time Socket.io workspace update
          this.notificationsService.notifyPostStatus(post.workspaceId, {
            postId: post.id,
            status: "published",
            platform: postJob.platform,
          });
        } else {
          overallSuccess = false;
          const errorMsg = result.errorMessage || "Unknown error";
          errors.push(`${postJob.platform}: ${errorMsg}`);
          
          await prisma.postJob.update({
            where: { id: postJob.id },
            data: {
              status: "failed",
              errorMessage: errorMsg,
              retryCount: postJob.retryCount + 1,
            },
          });

          this.notificationsService.notifyPostStatus(post.workspaceId, {
            postId: post.id,
            status: "failed",
            platform: postJob.platform,
          });
        }
      } catch (err) {
        overallSuccess = false;
        const errorMsg = (err as Error).message;
        errors.push(`${postJob.platform}: ${errorMsg}`);

        await prisma.postJob.update({
          where: { id: postJob.id },
          data: {
            status: "failed",
            errorMessage: errorMsg,
            retryCount: postJob.retryCount + 1,
          },
        });

        this.notificationsService.notifyPostStatus(post.workspaceId, {
          postId: post.id,
          status: "failed",
          platform: postJob.platform,
        });
      }
    }

    // Update overall Post status based on all job results
    const finalPostStatus = overallSuccess ? "published" : "failed";
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: finalPostStatus,
        publishedAt: overallSuccess ? new Date() : null,
      },
    });

    if (overallSuccess) {
      this.notificationsService.notifyWorkspace(post.workspaceId, {
        id: `pub_ok_${postId}`,
        title: "Post Published Successfully 🎉",
        body: `Your content has been published to all targeted social channels.`,
      });
    } else {
      this.notificationsService.notifyWorkspace(post.workspaceId, {
        id: `pub_err_${postId}`,
        title: "Post Publication Failed ⚠️",
        body: `Failed to deliver post. Details: ${errors.join(", ")}`,
      });
      // Throw exception to trigger BullMQ retry logic if attempts remain
      if ((job.opts.attempts || 1) > (job.attemptsMade || 0) + 1) {
        throw new Error(`Publishing failed: ${errors.join("; ")}`);
      }
    }
  }

  /**
   * Helper to resolve the matching platform publisher strategy
   */
  private getPublisherForPlatform(platform: string): PlatformPublisher | null {
    switch (platform.toLowerCase()) {
      case "instagram":
        return this.instagramPublisher;
      case "twitter":
      case "x":
        return this.twitterPublisher;
      case "linkedin":
        return this.linkedInPublisher;
      case "facebook":
        return this.facebookPublisher;
      case "tiktok":
        return this.tiktokPublisher;
      default:
        return null;
    }
  }
}
