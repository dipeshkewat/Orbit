import { Injectable, Logger } from "@nestjs/common";
import { PostJob, SocialAccount } from "@prisma/client";
import {
  MetricFetchResult,
  PlatformMetrics,
  PlatformMetricFetcher,
  computeEngagementRate,
} from "./platform-metric-fetcher.interface";

/**
 * Facebook metric fetcher.
 * Reads Page post insights for the published post object.
 * `postJob.platformPostId` holds the Facebook post ID returned at publish time.
 */
@Injectable()
export class FacebookMetricsFetcher implements PlatformMetricFetcher {
  private readonly logger = new Logger(FacebookMetricsFetcher.name);

  async fetchMetrics(
    postJob: PostJob,
    account: SocialAccount,
    decryptedAccessToken: string
  ): Promise<MetricFetchResult> {
    const postId = postJob.platformPostId;
    if (!postId) {
      return {
        success: false,
        errorMessage: "Facebook metric fetch skipped: PostJob has no platformPostId.",
        retryable: false,
      };
    }

    const url =
      `https://graph.facebook.com/v21.0/${encodeURIComponent(postId)}/insights` +
      `?metric=post_impressions,post_impressions_unique,post_clicks` +
      `&access_token=${encodeURIComponent(decryptedAccessToken)}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as {
        error?: { message?: string; code?: number };
        data?: Array<{ name: string; values: Array<{ value: number }> }>;
      };

      if (!response.ok || data.error) {
        const tokenInvalid = response.status === 401 || response.status === 403 || data.error?.code === 190;
        return {
          success: false,
          errorMessage: `Facebook insights error: ${data.error?.message || `HTTP ${response.status}`}`,
          retryable: response.status === 429 && !tokenInvalid,
        };
      }

      const values = new Map<string, number>();
      for (const row of data.data ?? []) {
        values.set(row.name, row.values?.[0]?.value ?? 0);
      }

      const impressions = values.get("post_impressions") ?? 0;
      const reach = values.get("post_impressions_unique") ?? 0;
      const clicks = values.get("post_clicks") ?? 0;

      const metrics: PlatformMetrics = {
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        impressions,
        reach,
        clicks,
        engagementRate: computeEngagementRate(0, 0, 0, 0, impressions),
      };

      this.logger.log(
        `Fetched Facebook insights for account ${account.username} (post job ${postJob.id})`,
      );
      return { success: true, metrics };
    } catch (err) {
      this.logger.error(`Failed to fetch Facebook insights: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
        retryable: true,
      };
    }
  }
}
