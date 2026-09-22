import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class AnalyticsIngestService {
  constructor(
    @InjectQueue("analytics_ingest") private readonly queue: Queue,
  ) {}

  async scheduleMetricsIngest(
    postId: string,
    platform: string,
    postJobId: string,
    delayMs = 60 * 60 * 1000,
  ) {
    await this.queue.add(
      "ingest-metrics",
      {
        postId,
        postJobId,
        platform,
      },
      {
        jobId: `${postId}:${platform}`,
        delay: delayMs,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 60_000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
