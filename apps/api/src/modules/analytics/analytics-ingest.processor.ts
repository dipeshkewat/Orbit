import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { prisma } from "@orbit/db";
import type { PostJob, SocialAccount } from "@prisma/client";
import { SocialAccountsService } from "../social-accounts/social-accounts.service";
import { AnalyticsService } from "./analytics.service";
import { InstagramMetricsFetcher } from "./adapters/instagram-metrics.fetcher";
import { TwitterMetricsFetcher } from "./adapters/twitter-metrics.fetcher";
import { LinkedInMetricsFetcher } from "./adapters/linkedin-metrics.fetcher";
import { FacebookMetricsFetcher } from "./adapters/facebook-metrics.fetcher";
import { TikTokMetricsFetcher } from "./adapters/tiktok-metrics.fetcher";
import {
  MetricFetchResult,
  PlatformMetricFetcher,
} from "./adapters/platform-metric-fetcher.interface";

/**
 * Worker for the `analytics_ingest` queue.
 *
 * Jobs are scheduled by AnalyticsIngestService roughly one hour after a
 * successful publish. This processor resolves the PostJob, decrypts the
 * account token, pulls live metrics through the platform fetcher adapter,
 * and upserts them into PostMetric for dashboard aggregation.
 *
 * Retry semantics follow the delivery rules: transient failures (rate
 * limits, network errors) rethrow so BullMQ retries with backoff, while
 * permanent failures (missing platformPostId, deleted posts, bad tokens)
 * are logged and swallowed so they don't burn retries.
 */
@Processor("analytics_ingest")
export class AnalyticsIngestProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsIngestProcessor.name);

  constructor(
    private readonly socialAccountsService: SocialAccountsService,
    private readonly analyticsService: AnalyticsService,
    private readonly instagramFetcher: InstagramMetricsFetcher,
    private readonly twitterFetcher: TwitterMetricsFetcher,
    private readonly linkedInFetcher: LinkedInMetricsFetcher,
    private readonly facebookFetcher: FacebookMetricsFetcher,
    private readonly tiktokFetcher: TikTokMetricsFetcher,
  ) {
    super();
  }

  async process(
    job: Job<{ postId: string; postJobId: string; platform: string }>,
  ): Promise<void> {
    const { postId, postJobId, platform } = job.data;
    this.logger.log(
      `Ingesting ${platform} metrics for post ${postId} (job ${postJobId})`,
    );

    const postJob = await prisma.postJob.findUnique({
      where: { id: postJobId },
      include: { socialAccount: true },
    });

    if (!postJob) {
      // Post jobs are never deleted independently of posts (cascade), so a
      // missing row means the post itself was deleted. Nothing to ingest.
      this.logger.warn(
        `PostJob ${postJobId} not found for post ${postId}. Skipping ingest.`,
      );
      return;
    }

    // Only ingest for successfully published jobs.
    if (postJob.status !== "published" || !postJob.publishedAt) {
      this.logger.warn(
        `PostJob ${postJobId} is ${postJob.status}, not published. Skipping ingest.`,
      );
      return;
    }

    const fetcher = this.getFetcherForPlatform(postJob.platform);
    if (!fetcher) {
      this.logger.warn(
        `No metric fetcher for platform ${postJob.platform}. Skipping ingest.`,
      );
      return;
    }

    const result = await this.fetchWithToken(postJob);

    if (result.success && result.metrics) {
      await this.analyticsService.recordPostMetrics({
        postId: postJob.postId,
        platform: postJob.platform,
        externalId: postJob.platformPostId ?? "",
        metrics: result.metrics,
      });
      this.logger.log(
        `Stored ${platform} metrics for post ${postId} (job ${postJobId}).`,
      );
      return;
    }

    if (result.retryable) {
      // Rethrowing makes BullMQ retry per the job's attempts/backoff options
      // (3 attempts, exponential backoff from 60s, set by AnalyticsIngestService).
      throw new Error(
        `Retryable metric fetch failure for ${platform}: ${result.errorMessage}`,
      );
    }

    this.logger.warn(
      `Non-retryable metric fetch failure for ${platform} (job ${postJobId}): ${result.errorMessage}`,
    );
  }

  /**
   * Resolve the decrypted access token for the job's social account.
   * Kept separate for testability.
   */
  private async fetchWithToken(
    postJob: PostJob & { socialAccount: SocialAccount },
  ): Promise<MetricFetchResult> {
    try {
      const decryptedToken = await this.socialAccountsService.getDecryptedAccessToken(
        postJob.socialAccount.workspaceId,
        postJob.socialAccount.id,
      );

      const fetcher = this.getFetcherForPlatform(postJob.platform);
      if (!fetcher) {
        return {
          success: false,
          errorMessage: `Unsupported metrics platform: ${postJob.platform}`,
          retryable: false,
        };
      }

      return await fetcher.fetchMetrics(postJob, postJob.socialAccount, decryptedToken);
    } catch (err) {
      // Token resolution failures (missing account, bad key) are permanent
      // for this job run; BullMQ retries wouldn't change the outcome unless
      // the account is reconnected, which re-runs ingest through publishing.
      this.logger.warn(
        `Token resolution failed for account ${postJob.socialAccount.id}: ${(err as Error).message}`,
      );
      return {
        success: false,
        errorMessage: (err as Error).message,
        retryable: false,
      };
    }
  }

  /**
   * Helper to resolve the matching platform metric fetcher strategy.
   */
  private getFetcherForPlatform(platform: string): PlatformMetricFetcher | null {
    switch (platform.toLowerCase()) {
      case "instagram":
        return this.instagramFetcher;
      case "twitter":
      case "x":
        return this.twitterFetcher;
      case "linkedin":
        return this.linkedInFetcher;
      case "facebook":
        return this.facebookFetcher;
      case "tiktok":
        return this.tiktokFetcher;
      default:
        return null;
    }
  }
}
