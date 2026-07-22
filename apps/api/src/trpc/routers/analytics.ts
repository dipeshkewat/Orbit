import { z } from "zod";
import { TrpcService } from "../trpc.service";

export function createAnalyticsRouter(trpc: TrpcService) {
  return trpc.router({
    getPostMetrics: trpc.protectedProcedure
      .input(
        z.object({
          postId: z.string().uuid(),
        })
      )
      .query(async ({ input }) => {
        // Return dummy analytics data for now. ClickHouse wiring comes later.
        return {
          postId: input.postId,
          likes: 245,
          comments: 32,
          shares: 12,
          saves: 8,
          reach: 12500,
          impressions: 15400,
          engagementRate: 2.3,
        };
      }),

    getAccountMetrics: trpc.protectedProcedure
      .input(
        z.object({
          accountId: z.string().uuid(),
          from: z.string(),
          to: z.string(),
        })
      )
      .query(async ({ input }) => {
        return {
          accountId: input.accountId,
          followersHistory: [
            { date: "2026-06-01", count: 12000 },
            { date: "2026-06-15", count: 12200 },
            { date: "2026-06-30", count: 12400 },
          ],
        };
      }),

    getTopPosts: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          limit: z.number().min(1).max(50).default(5),
        })
      )
      .query(async ({ input }) => {
        void input;
        return [
          {
            id: "post_top_1",
            content: "We just launched our new AI caption tool! 🚀",
            engagementRate: 7.8,
            likes: 450,
          },
        ];
      }),

    exportCSV: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          from: z.string(),
          to: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        void input;
        return {
          csvUrl: "https://cdn.orbit.com/exports/analytics_mock.csv",
        };
      }),
  });
}
