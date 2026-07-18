import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RedisModule } from "./modules/redis/redis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";
import { SocialAccountsModule } from "./modules/social-accounts/social-accounts.module";
import { PostsModule } from "./modules/posts/posts.module";
import { SchedulerModule } from "./modules/scheduler/scheduler.module";
import { PublisherModule } from "./modules/publisher/publisher.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AiModule } from "./modules/ai/ai.module";
import { MediaModule } from "./modules/media/media.module";
import { BillingModule } from "./modules/billing/billing.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { WebhooksModule } from "./modules/webhooks/webhooks.module";
import { PublicApiModule } from "./modules/public-api/public-api.module";
import { TrpcModule } from "./trpc/trpc.module";

@Module({
  imports: [
    // Global config — loads .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // Global Redis client
    RedisModule,

    // Core modules
    AuthModule,
    WorkspaceModule,
    SocialAccountsModule,
    PostsModule,
    SchedulerModule,
    PublisherModule,
    AnalyticsModule,
    AiModule,
    MediaModule,
    BillingModule,
    NotificationsModule,
    SearchModule,
    WebhooksModule,
    PublicApiModule,
    TrpcModule,
  ],
})
export class AppModule {}
