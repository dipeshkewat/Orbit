import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TeamRoleSchema } from "@orbit/types";
import { TrpcService } from "../trpc.service";
import { WorkspaceService } from "../../modules/workspace/workspace.service";
import { NotificationsService } from "../../modules/notifications/notifications.service";

const WorkspaceInputSchema = z.object({ workspaceId: z.string().uuid() });
const ManageableRoleSchema = TeamRoleSchema.refine((role) => role !== "owner", {
  message: "Ownership cannot be assigned through this procedure",
});

export function createWorkspaceRouter(
  trpc: TrpcService,
  workspaceService: WorkspaceService,
  notificationsService: NotificationsService,
) {
  return trpc.router({
    getMe: trpc.protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
      }
      const user = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.userId },
        select: { id: true },
      });
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User account is not provisioned" });
      }
      const member = await ctx.prisma.teamMember.findFirst({
        where: { userId: user.id, inviteStatus: "accepted" },
        select: { workspaceId: true },
      });
      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" });
      }
      return workspaceService.getWorkspaceById(member.workspaceId);
    }),

    getMembers: trpc.protectedProcedure
      .input(WorkspaceInputSchema)
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return workspaceService.getWorkspaceMembers(input.workspaceId);
      }),

    invite: trpc.protectedProcedure
      .input(
        WorkspaceInputSchema.extend({
          email: z.string().email(),
          role: ManageableRoleSchema,
        }),
      )
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId, ["owner", "admin"]);
        const member = await workspaceService.inviteMember(input.workspaceId, input.email, input.role);
        const inviteToken = workspaceService.createInviteToken(input.workspaceId, input.email, input.role);
        const inviteUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/accept-invite?token=${encodeURIComponent(inviteToken)}&workspaceId=${input.workspaceId}`;

        try {
          await notificationsService.sendEmail(
            input.email,
            "You’ve been invited to Orbit",
            `<p>You have been invited to join a workspace in Orbit.</p><p><a href="${inviteUrl}">Accept invite</a></p>`,
          );
        } catch (error) {
          // best effort; invite still gets created even if outbound email fails
          // eslint-disable-next-line no-console
          console.warn("Failed to send invite email", error);
        }

        return member;
      }),

    acceptInvite: trpc.protectedProcedure
      .input(
        WorkspaceInputSchema.extend({
          token: z.string().min(1),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.userId) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
        }

        return workspaceService.acceptInvite(input.workspaceId, input.token, ctx.userId);
      }),

    updateMemberRole: trpc.protectedProcedure
      .input(
        WorkspaceInputSchema.extend({
          memberId: z.string().uuid(),
          role: ManageableRoleSchema,
        }),
      )
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId, ["owner", "admin"]);
        return workspaceService.updateMemberRole(input.workspaceId, input.memberId, input.role);
      }),

    removeMember: trpc.protectedProcedure
      .input(WorkspaceInputSchema.extend({ memberId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId, ["owner", "admin"]);
        return workspaceService.removeMember(input.workspaceId, input.memberId);
      }),
  });
}
