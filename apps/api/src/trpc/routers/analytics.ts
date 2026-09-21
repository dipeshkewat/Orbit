import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { AnalyticsService } from "../../modules/analytics/analytics.service";

const DateRangeSchema = z.object({
  workspaceId: z.string().uuid(),
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export function createAnalyticsRouter(trpc: TrpcService, analyticsService: AnalyticsService) {
  return trpc.router({
    getOverview: trpc.protectedProcedure
      .input(
        DateRangeSchema.extend({ platform: z.string().min(1).optional() }),
      )
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return analyticsService.getWorkspaceOverview(
          input.workspaceId,
          new Date(input.from),
          new Date(input.to),
          input.platform,
        );
      }),

    getPlatformBreakdown: trpc.protectedProcedure
      .input(
        DateRangeSchema,
      )
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return analyticsService.getPlatformBreakdown(
          input.workspaceId,
          new Date(input.from),
          new Date(input.to),
        );
      }),

    getTimeSeries: trpc.protectedProcedure
      .input(DateRangeSchema)
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return analyticsService.getTimeSeries(
          input.workspaceId,
          new Date(input.from),
          new Date(input.to),
        );
      }),

    getTopPosts: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          limit: z.number().min(1).max(50).default(5),
        })
      )
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        const posts = await analyticsService.getPostAnalytics(input.workspaceId, {
          limit: input.limit,
        });
        return posts
          .sort((left, right) => right.totalEngagement - left.totalEngagement)
          .slice(0, input.limit);
      }),

    getPostMetrics: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          postId: z.string().uuid(),
        })
      )
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        const posts = await analyticsService.getPostAnalytics(input.workspaceId, { limit: 100 });
        return posts.find((post) => post.id === input.postId) ?? null;
      }),

    exportCSV: trpc.protectedProcedure
      .input(DateRangeSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return {
          filename: `orbit-analytics-${input.from.slice(0, 10)}-${input.to.slice(0, 10)}.csv`,
          content: await analyticsService.exportCsv(
            input.workspaceId,
            new Date(input.from),
            new Date(input.to),
          ),
        };
      }),
  });
}
