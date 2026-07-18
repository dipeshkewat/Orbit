import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class PostSchedulerService {
  private readonly logger = new Logger(PostSchedulerService.name);

  constructor(
    @InjectQueue("post_publish") private readonly publishQueue: Queue
  ) {}

  /**
   * Schedule a post to publish at a specific date and time.
   * Leverages BullMQ delayed jobs using the postId as the unique jobId.
   */
  async schedulePost(postId: string, scheduledAt: Date) {
    const delay = scheduledAt.getTime() - Date.now();
    
    // If the scheduled time is in the past, default to executing immediately
    const safeDelay = Math.max(0, delay);

    this.logger.log(`Scheduling post ${postId} with delay of ${safeDelay}ms`);

    // Remove any existing job for this postId to avoid duplicate runs
    await this.cancelScheduledPost(postId);

    await this.publishQueue.add(
      "publish-job",
      { postId },
      {
        delay: safeDelay,
        jobId: postId, // Using postId as jobId allows easy cancellation
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 30000, // 30s → 2m → 10m
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
  }

  /**
   * Cancel a scheduled post by removing it from the delayed queue
   */
  async cancelScheduledPost(postId: string): Promise<boolean> {
    const job = await this.publishQueue.getJob(postId);
    if (job) {
      await job.remove();
      this.logger.log(`Cancelled scheduled post job for postId: ${postId}`);
      return true;
    }
    return false;
  }
}
