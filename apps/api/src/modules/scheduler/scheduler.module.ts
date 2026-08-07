import { Module, Logger } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PostSchedulerService } from "./post-scheduler.service";

const logger = new Logger("SchedulerModule");

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");
        if (redisUrl) {
          // Parse connection URL (e.g. rediss://default:pass@host:port)
          try {
            const url = new URL(redisUrl);
            return {
              connection: {
                host: url.hostname,
                port: parseInt(url.port || "6379", 10),
                username: url.username || undefined,
                password: url.password || undefined,
                tls: url.protocol === "rediss:" ? {} : undefined,
              },
            };
          } catch (e) {
            logger.error(`Failed to parse REDIS_URL, falling back to default localhost: ${(e as Error).message}`);
          }
        }
        return {
          connection: {
            host: configService.get<string>("REDIS_HOST", "localhost"),
            port: configService.get<number>("REDIS_PORT", 6379),
          },
        };
      },
      inject: [ConfigService],
    }),
    
    // Register all 6 queues defined in the technical architecture
    BullModule.registerQueue(
      { name: "post_schedule" },
      { name: "post_publish" },
      { name: "post_notify" },
      { name: "analytics_ingest" },
      { name: "token_refresh" },
      { name: "media_process" }
    ),
  ],
  providers: [PostSchedulerService],
  exports: [BullModule, PostSchedulerService],
})
export class SchedulerModule {}
