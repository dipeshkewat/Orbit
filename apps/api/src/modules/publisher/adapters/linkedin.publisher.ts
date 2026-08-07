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
    void job;

    try {
      const authorUrn = account.platformUserId.startsWith("urn:li:")
        ? account.platformUserId
        : `urn:li:person:${account.platformUserId}`;

      const mediaUrls = (post.mediaUrls as string[]) || [];
      const hasMedia = mediaUrls.length > 0;

      const payload: Record<string, any> = {
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: post.content || "",
            },
            shareMediaCategory: hasMedia ? "ARTICLE" : "NONE",
            media: hasMedia
              ? [
                  {
                    status: "READY",
                    originalUrl: mediaUrls[0],
                  },
                ]
              : undefined,
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${decryptedAccessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.message) {
        const errorMsg = data.message || "Failed to publish post to LinkedIn.";
        this.logger.error(`LinkedIn API Error: ${errorMsg}`);
        return {
          success: false,
          errorMessage: errorMsg,
        };
      }

      const platformPostId = data.id || `urn:li:share:${Math.random().toString(36).substring(2, 12)}`;
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
