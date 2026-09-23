import { Injectable } from "@nestjs/common";
import { TrpcService } from "./trpc.service";
import { createWorkspaceRouter } from "./routers/workspace";
import { createPostsRouter } from "./routers/posts";
import { createSocialAccountsRouter } from "./routers/social-accounts";
import { createAnalyticsRouter } from "./routers/analytics";
import { createAiRouter } from "./routers/ai";
import { AiService } from "../modules/ai/ai.service";
import { AiDifferentiationService } from "../modules/ai/ai-differentiation.service";
import { WebhooksService } from "../modules/webhooks/webhooks.service";
import { createMediaRouter } from "./routers/media";
import { createBillingRouter } from "./routers/billing";
import { createNotificationsRouter } from "./routers/notifications";
import { createPlatformRouter } from "./routers/platform";
import { SocialAccountsService } from "../modules/social-accounts/social-accounts.service";
import { OAuthStateService } from "../modules/social-accounts/oauth-state.service";
import { OAuthConnectionService } from "../modules/social-accounts/oauth-connection.service";
import { PostsService } from "../modules/posts/posts.service";
import { MediaService } from "../modules/media/media.service";
import { WorkspaceService } from "../modules/workspace/workspace.service";
import { NotificationsService } from "../modules/notifications/notifications.service";
import { AnalyticsService } from "../modules/analytics/analytics.service";
import { BillingService } from "../modules/billing/billing.service";
import { EntitlementService } from "../modules/billing/entitlement.service";

@Injectable()
export class TrpcRouter {
  public appRouter;

  constructor(
    private readonly trpc: TrpcService,
    socialAccounts: SocialAccountsService,
    oauthState: OAuthStateService,
    oauthConnection: OAuthConnectionService,
    postsService: PostsService,
    mediaService: MediaService,
    workspaceService: WorkspaceService,
    notificationsService: NotificationsService,
    analyticsService: AnalyticsService,
    billingService: BillingService,
    entitlementService: EntitlementService,
    aiService: AiService,
    aiDifferentiation: AiDifferentiationService,
    webhooksService: WebhooksService,
  ) {
    this.appRouter = this.trpc.router({
      workspace: createWorkspaceRouter(this.trpc, workspaceService, notificationsService),
      posts: createPostsRouter(this.trpc, postsService, notificationsService),
      socialAccounts: createSocialAccountsRouter(this.trpc, socialAccounts, oauthState, oauthConnection),
      analytics: createAnalyticsRouter(this.trpc, analyticsService),
      ai: createAiRouter(this.trpc, aiService, aiDifferentiation),
      media: createMediaRouter(this.trpc, mediaService),
      billing: createBillingRouter(this.trpc, billingService, entitlementService),
      notifications: createNotificationsRouter(this.trpc),
      platform: createPlatformRouter(this.trpc, entitlementService, webhooksService),
    });
  }
}

// Export the AppRouter type for frontend type-safety
export type AppRouter = TrpcRouter["appRouter"];
