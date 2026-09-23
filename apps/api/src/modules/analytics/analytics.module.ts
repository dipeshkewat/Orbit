import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsIngestService } from "./analytics-ingest.service";
import { AnalyticsIngestProcessor } from "./analytics-ingest.processor";
import { SocialAccountsModule } from "../social-accounts/social-accounts.module";
import { InstagramMetricsFetcher } from "./adapters/instagram-metrics.fetcher";
import { TwitterMetricsFetcher } from "./adapters/twitter-metrics.fetcher";
import { LinkedInMetricsFetcher } from "./adapters/linkedin-metrics.fetcher";
import { FacebookMetricsFetcher } from "./adapters/facebook-metrics.fetcher";
import { TikTokMetricsFetcher } from "./adapters/tiktok-metrics.fetcher";

@Module({
  imports: [
    BullModule.registerQueue({ name: "analytics_ingest" }),
    SocialAccountsModule,
  ],
  providers: [
    AnalyticsService,
    AnalyticsIngestService,
    AnalyticsIngestProcessor,
    InstagramMetricsFetcher,
    TwitterMetricsFetcher,
    LinkedInMetricsFetcher,
    FacebookMetricsFetcher,
    TikTokMetricsFetcher,
  ],
  exports: [AnalyticsService, AnalyticsIngestService],
})
export class AnalyticsModule {}
