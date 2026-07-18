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

@Injectable()
export class TrpcRouter {
  public appRouter;

  constructor(private readonly trpc: TrpcService) {
    this.appRouter = this.trpc.router({
      workspace: createWorkspaceRouter(this.trpc),
      posts: createPostsRouter(this.trpc),
      socialAccounts: createSocialAccountsRouter(this.trpc),
      analytics: createAnalyticsRouter(this.trpc),
      ai: createAiRouter(this.trpc),
      media: createMediaRouter(this.trpc),
      billing: createBillingRouter(this.trpc),
      notifications: createNotificationsRouter(this.trpc),
    });
  }
}

// Export the AppRouter type for frontend type-safety
export type AppRouter = TrpcRouter["appRouter"];
