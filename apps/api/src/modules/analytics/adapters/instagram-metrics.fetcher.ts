import { Injectable, Logger } from "@nestjs/common";
import { PostJob, SocialAccount } from "@prisma/client";
import {
  MetricFetchResult,
  PlatformMetrics,
  PlatformMetricFetcher,
  computeEngagementRate,
} from "./platform-metric-fetcher.interface";

/**
 * Instagram metric fetcher.
 * Uses the Graph API organic insights endpoint on the published media object.
 * `postJob.platformPostId` holds the Instagram media ID returned at publish time.
 */
@Injectable()
export class InstagramMetricsFetcher implements PlatformMetricFetcher {
  private readonly logger = new Logger(InstagramMetricsFetcher.name);

  async fetchMetrics(
    postJob: PostJob,
    account: SocialAccount,
    decryptedAccessToken: string
  ): Promise<MetricFetchResult> {
    const mediaId = postJob.platformPostId;
    if (!mediaId) {
      return {
        success: false,
        errorMessage: "Instagram metric fetch skipped: PostJob has no platformPostId.",
        retryable: false,
      };
    }

    const url =
      `https://graph.facebook.com/v21.0/${mediaId}/insights` +
      `?metric=likes,comments,shares,saved,reach,impressions` +
      `&access_token=${encodeURIComponent(decryptedAccessToken)}`;

    try {
      const response = await fetch(url);
      const data = (await response.json()) as {
        error?: { message?: string; code?: number; subcode?: number };
        data?: Array<{ name: string; values: Array<{ value: number }> }>;
      };

      if (!response.ok || data.error) {
        return this.toErrorResult(
          `Instagram insights error: ${data.error?.message || `HTTP ${response.status}`}`,
          response.status,
          data.error?.code,
          data.error?.subcode,
        );
      }

      const values = new Map<string, number>();
      for (const row of data.data ?? []) {
        values.set(row.name, row.values?.[0]?.value ?? 0);
      }

      const likes = values.get("likes") ?? 0;
      const comments = values.get("comments") ?? 0;
      const shares = values.get("shares") ?? 0;
      const saves = values.get("saved") ?? 0;
      const reach = values.get("reach") ?? 0;
      const impressions = values.get("impressions") ?? 0;

      const metrics: PlatformMetrics = {
        likes,
        comments,
        shares,
        saves,
        reach,
        impressions,
        clicks: 0,
        engagementRate: computeEngagementRate(likes, comments, shares, saves, reach),
      };

      this.logger.log(
        `Fetched Instagram insights for account ${account.username} (post job ${postJob.id})`,
      );
      return { success: true, metrics };
    } catch (err) {
      this.logger.error(`Failed to fetch Instagram insights: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
        retryable: true,
      };
    }
  }

  private toErrorResult(
    message: string,
    status: number,
    code?: number,
    subcode?: number,
  ): MetricFetchResult {
    // Token problems (HTTP 401/403, code 190, expired-session subcodes) are not
    // fixed by retrying; rate limits (HTTP 429, codes 4/17/32) are.
    const tokenInvalid =
      status === 401 ||
      status === 403 ||
      code === 190 ||
      subcode === 463 ||
      subcode === 467;
    void tokenInvalid;
    return {
      success: false,
      errorMessage: message,
      retryable: status === 429 || code === 4 || code === 17 || code === 32,
    };
  }
}
