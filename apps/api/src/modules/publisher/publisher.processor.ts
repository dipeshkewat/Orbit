import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { prisma } from "@orbit/db";
import { SocialAccountsService } from "../social-accounts/social-accounts.service";
import { NotificationsService } from "../notifications/notifications.service";
import { InstagramPublisher } from "./adapters/instagram.publisher";
import { TwitterPublisher } from "./adapters/twitter.publisher";
import { LinkedInPublisher } from "./adapters/linkedin.publisher";
import { FacebookPublisher } from "./adapters/facebook.publisher";
import { TikTokPublisher } from "./adapters/tiktok.publisher";
import { PlatformPublisher } from "./adapters/platform-publisher.interface";
import { isFinalAttempt, resolvePostStatus } from "./publishing-state";
import { AnalyticsIngestService } from "../analytics/analytics-ingest.service";

@Processor("post_publish")
export class PublisherProcessor extends WorkerHost {
  private readonly logger = new Logger(PublisherProcessor.name);

  constructor(
    private readonly socialAccountsService: SocialAccountsService,
    private readonly notificationsService: NotificationsService,
    private readonly analyticsIngestService: AnalyticsIngestService,
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
  async process(job: Job<{ postId: string }>): Promise<void> {
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

    if (post.status === "published") {
      return;
    }

    await prisma.post.updateMany({
      where: { id: postId, status: { in: ["scheduled", "queued", "retrying"] } },
      data: { status: "publishing" },
    });

    let hasRetryableFailure = false;
    const errors: string[] = [];
    const maxAttempts = job.opts.attempts ?? 1;
    const finalAttempt = isFinalAttempt(job.attemptsMade, maxAttempts);

    for (const postJob of post.postJobs) {
      if (postJob.status === "published") {
        continue; // Already published, skip (idempotency)
      }

      const claim = await prisma.postJob.updateMany({
        where: {
          id: postJob.id,
          status: { in: ["pending", "retrying", "failed"] },
        },
        data: { status: "publishing" },
      });
      if (claim.count !== 1) {
        continue;
      }

      try {
        const decryptedToken = await this.socialAccountsService.getDecryptedAccessToken(
          post.workspaceId,
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
              retryCount: postJob.retryCount + 1,
            },
          });
          
          await this.analyticsIngestService.scheduleMetricsIngest(
            post.id,
            postJob.platform,
            postJob.id,
          );

          // Send real-time Socket.io workspace update
          this.notificationsService.notifyPostStatus(post.workspaceId, {
            postId: post.id,
            status: "published",
            platform: postJob.platform,
          });
        } else {
          const errorMsg = result.errorMessage || "Unknown error";
          errors.push(`${postJob.platform}: ${errorMsg}`);
          hasRetryableFailure = !finalAttempt || hasRetryableFailure;
          
          await prisma.postJob.update({
            where: { id: postJob.id },
            data: {
              status: finalAttempt ? "failed" : "retrying",
              errorMessage: errorMsg,
              retryCount: postJob.retryCount + 1,
            },
          });

          if (finalAttempt) {
            this.notificationsService.notifyPostStatus(post.workspaceId, {
              postId: post.id,
              status: "failed",
              platform: postJob.platform,
            });
          }
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : "Unknown publishing error";
        errors.push(`${postJob.platform}: ${errorMsg}`);
        hasRetryableFailure = !finalAttempt || hasRetryableFailure;

        await prisma.postJob.update({
          where: { id: postJob.id },
          data: {
            status: finalAttempt ? "failed" : "retrying",
            errorMessage: errorMsg,
            retryCount: postJob.retryCount + 1,
          },
        });

        if (finalAttempt) {
          this.notificationsService.notifyPostStatus(post.workspaceId, {
            postId: post.id,
            status: "failed",
            platform: postJob.platform,
          });
        }
      }
    }

    const jobStatuses = await prisma.postJob.findMany({
      where: { postId },
      select: { status: true },
    });
    const finalPostStatus = resolvePostStatus(
      jobStatuses.map((item) => item.status),
      hasRetryableFailure,
    );
    const allPublished = finalPostStatus === "published";
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: finalPostStatus,
        publishedAt: allPublished ? new Date() : null,
      },
    });

    if (allPublished) {
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
      if (hasRetryableFailure) {
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
