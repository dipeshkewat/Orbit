import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PlatformSchema } from "@orbit/types";
import { TrpcService } from "../trpc.service";
import { SocialAccountsService } from "../../modules/social-accounts/social-accounts.service";
import { OAuthStateService } from "../../modules/social-accounts/oauth-state.service";
import { OAuthConnectionService } from "../../modules/social-accounts/oauth-connection.service";

const AccountInputSchema = z.object({
  workspaceId: z.string().uuid(),
  id: z.string().uuid(),
});

const OAuthStartSchema = z.object({
  workspaceId: z.string().uuid(),
  platform: PlatformSchema,
  redirectUri: z.string().url(),
});

const OAuthCompleteSchema = OAuthStartSchema.extend({
  code: z.string().min(1),
  state: z.string().min(1),
});

export function createSocialAccountsRouter(
  trpc: TrpcService,
  socialAccounts: SocialAccountsService,
  oauthState: OAuthStateService,
  oauthConnection: OAuthConnectionService,
) {
  return trpc.router({
    list: trpc.protectedProcedure
      .input(z.object({ workspaceId: z.string().uuid() }))
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return socialAccounts.listAccounts(input.workspaceId);
      }),

    getAuthorizationUrl: trpc.protectedProcedure
      .input(OAuthStartSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        if (!ctx.userId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
        }
        const state = await oauthState.createState({
          workspaceId: input.workspaceId,
          userId: ctx.userId,
          platform: input.platform,
          redirectUri: input.redirectUri,
        });
        return {
          authorizationUrl: oauthConnection.getAuthorizationUrl(input.platform, input.redirectUri, state),
        };
      }),

    connect: trpc.protectedProcedure
      .input(OAuthCompleteSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        if (!ctx.userId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "OAuth state does not match this workspace" });
        }
        return oauthConnection.complete(
          input.platform,
          input.code,
          input.redirectUri,
          input.state,
          input.workspaceId,
          ctx.userId,
        );
      }),

    disconnect: trpc.protectedProcedure
      .input(AccountInputSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return socialAccounts.disconnectAccount(input.workspaceId, input.id);
      }),

    refresh: trpc.protectedProcedure
      .input(AccountInputSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return socialAccounts.updateAccountStatus(input.workspaceId, input.id, "active");
      }),

    getHealth: trpc.protectedProcedure
      .input(AccountInputSchema)
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        const account = await ctx.prisma.socialAccount.findFirst({
          where: { id: input.id, workspaceId: input.workspaceId },
          select: { status: true, tokenExpiresAt: true },
        });
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
        }
        return account;
      }),
  });
}
