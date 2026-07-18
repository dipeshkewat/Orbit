import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { TeamRoleSchema } from "@socialsphear/types";

export function createWorkspaceRouter(trpc: TrpcService) {
  return trpc.router({
    getMe: trpc.protectedProcedure.query(async ({ ctx }) => {
      // Find the user's workspace or return a placeholder
      const member = await ctx.prisma.teamMember.findFirst({
        where: { userId: ctx.userId },
        include: { workspace: true },
      });

      if (member) {
        return member.workspace;
      }

      // Return a mock/fallback workspace if none exists for the user yet
      return {
        id: "ws_default",
        name: "My Workspace",
        slug: "my-workspace",
        logoUrl: null,
        plan: "free",
        ownerId: ctx.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

    create: trpc.protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return {
          id: "ws_new",
          name: input.name,
          slug: input.slug,
          logoUrl: null,
          plan: "free",
          ownerId: ctx.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

    update: trpc.protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          logoUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          id: "ws_updated",
          name: input.name ?? "Updated Workspace",
          slug: "updated-workspace",
          logoUrl: input.logoUrl ?? null,
          plan: "free",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }),

    getMembers: trpc.protectedProcedure.query(async () => {
      return [
        {
          id: "mem_1",
          userId: "user_1",
          role: "owner",
          inviteStatus: "accepted",
          user: {
            name: "Workspace Owner",
            email: "owner@workspace.com",
            avatarUrl: null,
          },
        },
      ];
    }),

    invite: trpc.protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          role: TeamRoleSchema,
        })
      )
      .mutation(async ({ input }) => {
        return {
          id: "invite_new",
          email: input.email,
          role: input.role,
          status: "pending",
        };
      }),

    updateMemberRole: trpc.protectedProcedure
      .input(
        z.object({
          memberId: z.string(),
          role: TeamRoleSchema,
        })
      )
      .mutation(async ({ input }) => {
        return {
          id: input.memberId,
          role: input.role,
        };
      }),
  });
}
