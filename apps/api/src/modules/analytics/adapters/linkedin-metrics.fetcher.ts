import { Injectable, Logger } from "@nestjs/common";
import { PostJob, SocialAccount } from "@prisma/client";
import {
  MetricFetchResult,
  PlatformMetrics,
  PlatformMetricFetcher,
  computeEngagementRate,
} from "./platform-metric-fetcher.interface";

/**
 * LinkedIn metric fetcher.
 * Reads total share statistics for the published UGC post.
 * `postJob.platformPostId` holds the LinkedIn share/activity URN returned at publish time.
 */
@Injectable()
export class LinkedInMetricsFetcher implements PlatformMetricFetcher {
  private readonly logger = new Logger(LinkedInMetricsFetcher.name);

  async fetchMetrics(
    postJob: PostJob,
    account: SocialAccount,
    decryptedAccessToken: string
  ): Promise<MetricFetchResult> {
    const shareUrn = postJob.platformPostId;
    if (!shareUrn) {
      return {
        success: false,
        errorMessage: "LinkedIn metric fetch skipped: PostJob has no platformPostId.",
        retryable: false,
      };
    }

    // Total share statistics endpoint accepts the share or activity URN.
    const url =
      `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(shareUrn)}` +
      `/totalShareStatistics`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${decryptedAccessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });

      if (!response.ok) {
        // 401/403 mean the token cannot read stats; 429 is a rate limit.
        const retryable = response.status === 429;
        return {
          success: false,
          errorMessage: `LinkedIn share statistics error: HTTP ${response.status}`,
          retryable,
        };
      }

      const data = (await response.json()) as {
        totalShareStatistics?: {
          likeCount?: number;
          commentCount?: number;
          shareCount?: number;
          impressionCount?: number;
          clickCount?: number;
          engagement?: number;
        };
      };
      const stats = data.totalShareStatistics ?? {};

      const likes = stats.likeCount ?? 0;
      const comments = stats.commentCount ?? 0;
      const shares = stats.shareCount ?? 0;
      const impressions = stats.impressionCount ?? 0;

      const metrics: PlatformMetrics = {
        likes,
        comments,
        shares,
        saves: 0,
        impressions,
        reach: 0,
        clicks: stats.clickCount ?? 0,
        engagementRate:
          stats.engagement ??
          computeEngagementRate(likes, comments, shares, 0, impressions),
      };

      this.logger.log(
        `Fetched LinkedIn share statistics for account ${account.username} (post job ${postJob.id})`,
      );
      return { success: true, metrics };
    } catch (err) {
      this.logger.error(`Failed to fetch LinkedIn statistics: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
        retryable: true,
      };
    }
  }
}
