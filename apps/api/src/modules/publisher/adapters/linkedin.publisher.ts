import { Injectable, Logger } from "@nestjs/common";
import { Post, PostJob, SocialAccount } from "@prisma/client";
import { PlatformPublisher, PublishResult } from "./platform-publisher.interface";

@Injectable()
export class LinkedInPublisher implements PlatformPublisher {
  private readonly logger = new Logger(LinkedInPublisher.name);

  async publish(
    job: PostJob,
    account: SocialAccount,
    post: Post,
    decryptedAccessToken: string
  ): Promise<PublishResult> {
    this.logger.log(`Publishing post ${post.id} to LinkedIn account: ${account.username}`);
    void decryptedAccessToken;
    void job;

    try {
      // In production:
      // POST https://api.linkedin.com/v2/ugcPosts
      // headers: { Authorization: Bearer access_token }
      // body: { author: urn:li:person:{platformUserId}, lifecycleState: PUBLISHED, specificContent: ... }

      await new Promise((resolve) => setTimeout(resolve, 900));

      const platformPostId = `urn:li:share:${Math.random().toString(36).substring(2, 12)}`;
      return {
        success: true,
        platformPostId,
        platformUrl: `https://www.linkedin.com/feed/update/${platformPostId}`,
      };
    } catch (err) {
      this.logger.error(`Failed to publish to LinkedIn: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
      };
    }
  }
}
