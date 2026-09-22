import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsIngestService } from "./analytics-ingest.service";

@Module({
  imports: [BullModule.registerQueue({ name: "analytics_ingest" })],
  providers: [AnalyticsService, AnalyticsIngestService],
  exports: [AnalyticsService, AnalyticsIngestService],
})
export class AnalyticsModule {}
