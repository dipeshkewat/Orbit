import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TeamRoleSchema } from "@orbit/types";
import { TrpcService } from "../trpc.service";
import { WorkspaceService } from "../../modules/workspace/workspace.service";

const WorkspaceInputSchema = z.object({ workspaceId: z.string().uuid() });
const ManageableRoleSchema = TeamRoleSchema.refine((role) => role !== "owner", {
  message: "Ownership cannot be assigned through this procedure",
});

export function createWorkspaceRouter(trpc: TrpcService, workspaceService: WorkspaceService) {
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
        return workspaceService.inviteMember(input.workspaceId, input.email, input.role);
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
