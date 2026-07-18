import { Injectable, Logger } from "@nestjs/common";
import { Post, PostJob, SocialAccount } from "@prisma/client";
import { PlatformPublisher, PublishResult } from "./platform-publisher.interface";

@Injectable()
export class FacebookPublisher implements PlatformPublisher {
  private readonly logger = new Logger(FacebookPublisher.name);

  async publish(
    job: PostJob,
    account: SocialAccount,
    post: Post,
    decryptedAccessToken: string
  ): Promise<PublishResult> {
    this.logger.log(`Publishing post ${post.id} to Facebook Page: ${account.username}`);
    void decryptedAccessToken;
    void job;

    try {
      // In production:
      // POST https://graph.facebook.com/v21.0/{platformUserId}/feed
      // params: { message: post.content, access_token }

      await new Promise((resolve) => setTimeout(resolve, 800));

      const platformPostId = `fb_page_post_${Math.random().toString(36).substring(2, 12)}`;
      return {
        success: true,
        platformPostId,
        platformUrl: `https://www.facebook.com/${account.platformUserId}/posts/${platformPostId}`,
      };
    } catch (err) {
      this.logger.error(`Failed to publish to Facebook: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
      };
    }
  }
}
