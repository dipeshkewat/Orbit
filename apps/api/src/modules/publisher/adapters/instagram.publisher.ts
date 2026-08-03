import { Injectable, Logger } from "@nestjs/common";
import { Post, PostJob, SocialAccount } from "@prisma/client";
import { PlatformPublisher, PublishResult } from "./platform-publisher.interface";

@Injectable()
export class InstagramPublisher implements PlatformPublisher {
  private readonly logger = new Logger(InstagramPublisher.name);

  async publish(
    job: PostJob,
    account: SocialAccount,
    post: Post,
    decryptedAccessToken: string
  ): Promise<PublishResult> {
    this.logger.log(`Publishing post ${post.id} to Instagram Account ID: ${account.platformUserId}`);
    void job;

    try {
      const mediaUrls = (post.mediaUrls as string[]) || [];
      if (mediaUrls.length === 0) {
        return {
          success: false,
          errorMessage: "Instagram requires at least one image or video attachment URL.",
        };
      }

      const igUserId = account.platformUserId;
      const imageUrl = mediaUrls[0];

      // Step 1: Create Media Container
      const containerUrl = `https://graph.facebook.com/v21.0/${igUserId}/media`;
      const containerRes = await fetch(containerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: post.content || "",
          access_token: decryptedAccessToken,
        }),
      });

      const containerData = await containerRes.json();
      if (!containerRes.ok || containerData.error) {
        const errorMsg = containerData.error?.message || "Failed to create Instagram media container.";
        this.logger.error(`Instagram Media Container Error: ${errorMsg}`);
        return {
          success: false,
          errorMessage: errorMsg,
        };
      }

      const creationId = containerData.id;

      // Step 2: Publish Media Container
      const publishUrl = `https://graph.facebook.com/v21.0/${igUserId}/media_publish`;
      const publishRes = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: decryptedAccessToken,
        }),
      });

      const publishData = await publishRes.json();
      if (!publishRes.ok || publishData.error) {
        const errorMsg = publishData.error?.message || "Failed to publish Instagram media container.";
        this.logger.error(`Instagram Media Publish Error: ${errorMsg}`);
        return {
          success: false,
          errorMessage: errorMsg,
        };
      }

      const platformPostId = publishData.id;
      return {
        success: true,
        platformPostId,
        platformUrl: `https://www.instagram.com/p/${platformPostId}/`,
      };
    } catch (err) {
      this.logger.error(`Failed to publish to Instagram: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
      };
    }
  }
}
