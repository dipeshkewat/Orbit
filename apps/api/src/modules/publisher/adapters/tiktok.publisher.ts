import { Injectable, Logger } from "@nestjs/common";
import { Post, PostJob, SocialAccount } from "@prisma/client";
import { PlatformPublisher, PublishResult } from "./platform-publisher.interface";

@Injectable()
export class TikTokPublisher implements PlatformPublisher {
  private readonly logger = new Logger(TikTokPublisher.name);

  async publish(
    job: PostJob,
    account: SocialAccount,
    post: Post,
    decryptedAccessToken: string
  ): Promise<PublishResult> {
    this.logger.log(`Publishing post ${post.id} to TikTok account: ${account.username}`);
    void decryptedAccessToken;
    void job;

    try {
      // In production:
      // POST https://open-api.tiktok.com/share/video/upload/
      // params: { open_id, access_token }

      const mediaUrls = (post.mediaUrls as string[]) || [];
      if (mediaUrls.length === 0) {
        return {
          success: false,
          errorMessage: "TikTok requires a video attachment.",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const platformPostId = `tiktok_video_${Math.random().toString(36).substring(2, 12)}`;
      return {
        success: true,
        platformPostId,
        platformUrl: `https://www.tiktok.com/@${account.username}/video/${platformPostId}`,
      };
    } catch (err) {
      this.logger.error(`Failed to publish to TikTok: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
      };
    }
  }
}
