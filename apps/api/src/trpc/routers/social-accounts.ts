import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { PlatformSchema } from "@orbit/types";

export function createSocialAccountsRouter(trpc: TrpcService) {
  return trpc.router({
    list: trpc.protectedProcedure.query(async ({ ctx }) => {
      const accounts = await ctx.prisma.socialAccount.findMany({
        orderBy: { createdAt: "desc" },
      });
      return accounts.map((acc: any) => ({
        id: acc.id,
        platform: acc.platform,
        username: acc.username,
        displayName: acc.displayName,
        avatarUrl: acc.avatarUrl,
        status: acc.status,
        tokenExpiresAt: acc.tokenExpiresAt,
        createdAt: acc.createdAt,
      }));
    }),

    connect: trpc.protectedProcedure
      .input(
        z.object({
          platform: PlatformSchema,
          code: z.string(),
          redirectUri: z.string().url().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Implement OAuth verification stub
        return {
          success: true,
          platform: input.platform,
          username: "mock_user",
        };
      }),

    disconnect: trpc.protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        await ctx.prisma.socialAccount.delete({
          where: { id: input.id },
        });
        return { success: true };
      }),

    refresh: trpc.protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        void input;
        return { success: true, status: "active" };
      }),

    getHealth: trpc.protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        const account = await ctx.prisma.socialAccount.findUnique({
          where: { id: input.id },
        });
        if (!account) throw new Error("Account not found");
        return {
          status: account.status,
          tokenExpiresAt: account.tokenExpiresAt,
        };
      }),
  });
}
