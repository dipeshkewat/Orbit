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
    this.logger.log(`Publishing post ${post.id} to Facebook Page ID: ${account.platformUserId}`);
    void job;

    try {
      const pageId = account.platformUserId;
      const url = `https://graph.facebook.com/v21.0/${pageId}/feed`;

      const mediaUrls = (post.mediaUrls as string[]) || [];
      const payload: Record<string, any> = {
        message: post.content || "",
        access_token: decryptedAccessToken,
      };

      if (mediaUrls.length > 0) {
        payload.link = mediaUrls[0];
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMsg = data.error?.message || "Failed to publish post to Facebook Page.";
        this.logger.error(`Facebook Graph API Error: ${errorMsg}`);
        return {
          success: false,
          errorMessage: errorMsg,
        };
      }

      const platformPostId = data.id;
      return {
        success: true,
        platformPostId,
        platformUrl: `https://www.facebook.com/${platformPostId}`,
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
