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
    this.logger.log(`Publishing post ${post.id} to Instagram account: ${account.username}`);
    void decryptedAccessToken;
    void job;

    try {
      // In production:
      // 1. Create media container: POST https://graph.facebook.com/v21.0/{platformUserId}/media
      //    params: { image_url/video_url, caption: post.content, access_token }
      // 2. Publish media container: POST https://graph.facebook.com/v21.0/{platformUserId}/media_publish
      //    params: { creation_id, access_token }
      
      const mediaUrls = post.mediaUrls as string[];
      if (mediaUrls.length === 0) {
        return {
          success: false,
          errorMessage: "Instagram requires at least one image or video attachment.",
        };
      }

      // Mock delay representing Graph API network requests
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const platformPostId = `ig_post_${Math.random().toString(36).substring(2, 10)}`;
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
