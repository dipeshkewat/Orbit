import { Injectable, Logger } from "@nestjs/common";
import { PostJob, SocialAccount } from "@prisma/client";
import {
  MetricFetchResult,
  PlatformMetrics,
  PlatformMetricFetcher,
  computeEngagementRate,
} from "./platform-metric-fetcher.interface";

/**
 * TikTok metric fetcher.
 * Queries the Content Posting API video query endpoint for published videos.
 * `postJob.platformPostId` holds the TikTok video ID returned at publish time.
 */
@Injectable()
export class TikTokMetricsFetcher implements PlatformMetricFetcher {
  private readonly logger = new Logger(TikTokMetricsFetcher.name);

  async fetchMetrics(
    postJob: PostJob,
    account: SocialAccount,
    decryptedAccessToken: string
  ): Promise<MetricFetchResult> {
    const videoId = postJob.platformPostId;
    if (!videoId) {
      return {
        success: false,
        errorMessage: "TikTok metric fetch skipped: PostJob has no platformPostId.",
        retryable: false,
      };
    }

    try {
      const response = await fetch(
        "https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${decryptedAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ filters: { video_ids: [videoId] } }),
        },
      );

      if (!response.ok) {
        return {
          success: false,
          errorMessage: `TikTok video query error: HTTP ${response.status}`,
          retryable: response.status === 429,
        };
      }

      const data = (await response.json()) as {
        error?: { code?: string; message?: string };
        data?: {
          videos?: Array<{
            like_count?: number;
            comment_count?: number;
            share_count?: number;
            view_count?: number;
          }>;
        };
      };

      if (data.error && data.error.code !== "ok") {
        return {
          success: false,
          errorMessage: `TikTok video query error: ${data.error.message || data.error.code}`,
          retryable: data.error.code === "rate_limit_exceeded",
        };
      }

      const video = data.data?.videos?.[0];
      if (!video) {
        return {
          success: false,
          errorMessage: "TikTok video not found in query response.",
          retryable: false,
        };
      }

      const likes = video.like_count ?? 0;
      const comments = video.comment_count ?? 0;
      const shares = video.share_count ?? 0;
      const views = video.view_count ?? 0;

      const metrics: PlatformMetrics = {
        likes,
        comments,
        shares,
        saves: 0,
        impressions: views,
        reach: views,
        clicks: 0,
        engagementRate: computeEngagementRate(likes, comments, shares, 0, views),
      };

      this.logger.log(
        `Fetched TikTok video metrics for account ${account.username} (post job ${postJob.id})`,
      );
      return { success: true, metrics };
    } catch (err) {
      this.logger.error(`Failed to fetch TikTok metrics: ${(err as Error).message}`);
      return {
        success: false,
        errorMessage: (err as Error).message,
        retryable: true,
      };
    }
  }
}
