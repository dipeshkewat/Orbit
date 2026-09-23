import { Module } from "@nestjs/common";
import { TrpcService } from "./trpc.service";
import { TrpcRouter } from "./trpc.router";
import { TrpcController } from "./trpc.controller";
import { SocialAccountsModule } from "../modules/social-accounts/social-accounts.module";
import { PostsModule } from "../modules/posts/posts.module";
import { MediaModule } from "../modules/media/media.module";
import { WorkspaceModule } from "../modules/workspace/workspace.module";
import { NotificationsModule } from "../modules/notifications/notifications.module";
import { AnalyticsModule } from "../modules/analytics/analytics.module";
import { BillingModule } from "../modules/billing/billing.module";
import { AiModule } from "../modules/ai/ai.module";

@Module({
  imports: [SocialAccountsModule, PostsModule, MediaModule, WorkspaceModule, NotificationsModule, AnalyticsModule, BillingModule, AiModule],
  controllers: [TrpcController],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService, TrpcRouter],
})
export class TrpcModule {}
