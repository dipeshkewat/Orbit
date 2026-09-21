import { Injectable } from "@nestjs/common";
import { TrpcService } from "./trpc.service";
import { createWorkspaceRouter } from "./routers/workspace";
import { createPostsRouter } from "./routers/posts";
import { createSocialAccountsRouter } from "./routers/social-accounts";
import { createAnalyticsRouter } from "./routers/analytics";
import { createAiRouter } from "./routers/ai";
import { createMediaRouter } from "./routers/media";
import { createBillingRouter } from "./routers/billing";
import { createNotificationsRouter } from "./routers/notifications";
import { SocialAccountsService } from "../modules/social-accounts/social-accounts.service";
import { OAuthStateService } from "../modules/social-accounts/oauth-state.service";
import { OAuthConnectionService } from "../modules/social-accounts/oauth-connection.service";
import { PostsService } from "../modules/posts/posts.service";
import { MediaService } from "../modules/media/media.service";
import { WorkspaceService } from "../modules/workspace/workspace.service";
import { NotificationsService } from "../modules/notifications/notifications.service";
import { AnalyticsService } from "../modules/analytics/analytics.service";

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
  ) {
    this.appRouter = this.trpc.router({
      workspace: createWorkspaceRouter(this.trpc, workspaceService, notificationsService),
      posts: createPostsRouter(this.trpc, postsService, notificationsService),
      socialAccounts: createSocialAccountsRouter(this.trpc, socialAccounts, oauthState, oauthConnection),
      analytics: createAnalyticsRouter(this.trpc, analyticsService),
      ai: createAiRouter(this.trpc),
      media: createMediaRouter(this.trpc, mediaService),
      billing: createBillingRouter(this.trpc),
      notifications: createNotificationsRouter(this.trpc),
    });
  }
}

// Export the AppRouter type for frontend type-safety
export type AppRouter = TrpcRouter["appRouter"];
