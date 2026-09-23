import { PostJob, SocialAccount } from "@prisma/client";

/**
 * Normalized metric snapshot returned by every platform fetcher.
 * Field names match the PostMetric columns so upserts stay trivial.
 */
export interface PlatformMetrics {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
  saves: number;
  engagementRate: number;
}

export interface MetricFetchResult {
  success: boolean;
  metrics?: PlatformMetrics;
  /** Provider error message when success is false (e.g. rate limit, token expiry). */
  errorMessage?: string;
  /** True when the failure is transient and the ingest job should be retried. */
  retryable?: boolean;
}

export interface PlatformMetricFetcher {
  fetchMetrics(
    postJob: PostJob,
    account: SocialAccount,
    decryptedAccessToken: string
  ): Promise<MetricFetchResult>;
}

/**
 * Shared default engagement-rate calculation: interactions per impression,
 * expressed as a percentage rounded to 2 decimals.
 */
export function computeEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  denominator: number,
): number {
  if (denominator <= 0) return 0;
  const rate = ((likes + comments + shares + saves) / denominator) * 100;
  return Math.round(rate * 100) / 100;
}
