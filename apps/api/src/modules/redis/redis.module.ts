import { Module, Global, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { RateLimiterGuard } from "./rate-limiter.guard";

export const REDIS_CLIENT = "REDIS_CLIENT";

const logger = new Logger("RedisModule");

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>("REDIS_URL");
        if (redisUrl) {
          try {
            return new Redis(redisUrl);
          } catch (e) {
            logger.error(`Failed to connect to REDIS_URL, falling back to localhost: ${(e as Error).message}`);
          }
        }
        return new Redis({
          host: configService.get<string>("REDIS_HOST", "localhost"),
          port: configService.get<number>("REDIS_PORT", 6379),
        });
      },
      inject: [ConfigService],
    },
    RateLimiterGuard,
  ],
  exports: [REDIS_CLIENT, RateLimiterGuard],
})
export class RedisModule {}
