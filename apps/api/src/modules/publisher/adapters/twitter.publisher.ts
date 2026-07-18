import { Injectable, Logger } from "@nestjs/common";
import { Post, PostJob, SocialAccount } from "@prisma/client";
import { PlatformPublisher, PublishResult } from "./platform-publisher.interface";

@Injectable()
export class TwitterPublisher implements PlatformPublisher {
  private readonly logger = new Logger(TwitterPublisher.name);

  async publish(
    job: PostJob,
    account: SocialAccount,
    post: Post,
    decryptedAccessToken: string
  ): Promise<PublishResult> {
    this.logger.log(`Publishing post ${post.id} to Twitter/X account: ${account.username}`);
    void decryptedAccessToken;
    void job;

    try {
      // In production:
      // POST https://api.twitter.com/2/tweets
      // headers: { Authorization: Bearer access_token }
      // body: { text: post.content }
      
      const content = post.content || "";
      if (content.length > 280) {
        return {
          success: false,
          errorMessage: "Tweet exceeds maximum character limit of 280 characters.",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      const platformPostId = `tweet_${Math.random().toString(36).substring(2, 10)}`;
      return {
        success: true,
        platformPostId,
        platformUrl: `https://twitter.com/${account.username}/status/${platformPostId}`,
      };
    } catch (err) {
      this.logger.error(`Failed to publish to Twitter/X: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
      };
    }
  }
}
