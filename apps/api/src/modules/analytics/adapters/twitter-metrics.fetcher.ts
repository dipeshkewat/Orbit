import { Injectable, Logger } from "@nestjs/common";
import { PostJob, SocialAccount } from "@prisma/client";
import {
  MetricFetchResult,
  PlatformMetrics,
  PlatformMetricFetcher,
  computeEngagementRate,
} from "./platform-metric-fetcher.interface";

/**
 * Twitter/X metric fetcher.
 * Uses the v2 tweets lookup with `tweet.fields=organic_metrics` (requires the
 * account to be the tweet author and elevated access on the app).
 * `postJob.platformPostId` holds the tweet ID returned at publish time.
 */
@Injectable()
export class TwitterMetricsFetcher implements PlatformMetricFetcher {
  private readonly logger = new Logger(TwitterMetricsFetcher.name);

  async fetchMetrics(
    postJob: PostJob,
    account: SocialAccount,
    decryptedAccessToken: string
  ): Promise<MetricFetchResult> {
    const tweetId = postJob.platformPostId;
    if (!tweetId) {
      return {
        success: false,
        errorMessage: "Twitter metric fetch skipped: PostJob has no platformPostId.",
        retryable: false,
      };
    }

    const url =
      `https://api.twitter.com/2/tweets/${encodeURIComponent(tweetId)}` +
      `?tweet.fields=organic_metrics,public_metrics`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${decryptedAccessToken}` },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            errorMessage: "Tweet not found (deleted or suspended).",
            retryable: false,
          };
        }
        return {
          success: false,
          errorMessage: `Twitter metrics error: HTTP ${response.status}`,
          retryable: response.status === 429,
        };
      }

      const data = (await response.json()) as {
        data?: {
          organic_metrics?: {
            like_count: number;
            reply_count: number;
            retweet_count: number;
            quote_count: number;
            impression_count: number;
            url_link_clicks?: number;
          };
          public_metrics?: {
            like_count: number;
            reply_count: number;
            retweet_count: number;
            quote_count: number;
            impression_count: number;
            url_link_clicks?: number;
          };
        };
        errors?: Array<{ title?: string; detail?: string }>;
      };

      // Some access tiers return the tweet without organic metrics; fall back to public.
      const metricsSource = data.data?.organic_metrics ?? data.data?.public_metrics;
      if (!metricsSource) {
        const apiError = data.errors?.[0]?.detail || "Tweet payload contained no metrics.";
        return { success: false, errorMessage: apiError, retryable: false };
      }

      const likes = metricsSource.like_count ?? 0;
      const comments = metricsSource.reply_count ?? 0;
      const shares =
        (metricsSource.retweet_count ?? 0) + (metricsSource.quote_count ?? 0);
      const impressions = metricsSource.impression_count ?? 0;
      const clicks = metricsSource.url_link_clicks ?? 0;

      const metrics: PlatformMetrics = {
        likes,
        comments,
        shares,
        saves: 0,
        impressions,
        reach: 0,
        clicks,
        engagementRate: computeEngagementRate(likes, comments, shares, 0, impressions),
      };

      this.logger.log(
        `Fetched Twitter metrics for account ${account.username} (post job ${postJob.id})`,
      );
      return { success: true, metrics };
    } catch (err) {
      this.logger.error(`Failed to fetch Twitter metrics: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
        retryable: true,
      };
    }
  }
}
