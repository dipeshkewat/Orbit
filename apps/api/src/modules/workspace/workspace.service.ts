import { Injectable, ConflictException, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@orbit/db";
import { EntitlementService } from "../billing/entitlement.service";

const INVITE_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

@Injectable()
export class WorkspaceService {
  constructor(private readonly entitlements: EntitlementService) {}

  private getInviteSecret() {
    return process.env.APP_SECRET || process.env.CLERK_SECRET_KEY || "orbit-dev-invite-secret";
  }

  private hashInvitePayload(payload: string) {
    return createHmac("sha256", this.getInviteSecret()).update(payload).digest("base64url");
  }

  createInviteToken(workspaceId: string, email: string, role?: string) {
    const payload = JSON.stringify({
      workspaceId,
      email,
      role: role ?? "editor",
      exp: Date.now() + INVITE_TOKEN_TTL_MS,
    });
    return `${Buffer.from(payload, "utf8").toString("base64url")}.${this.hashInvitePayload(payload)}`;
  }

  private verifyInviteToken(token: string) {
    const [payloadSegment, signature] = token.split(".");
    if (!payloadSegment || !signature) {
      throw new BadRequestException("Invalid invitation token");
    }

    const payloadText = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const expectedSignature = this.hashInvitePayload(payloadText);
    const providedSignature = Buffer.from(signature);
    const expectedValue = Buffer.from(expectedSignature);

    if (providedSignature.length !== expectedValue.length || !timingSafeEqual(providedSignature, expectedValue)) {
      throw new ForbiddenException("Invitation token signature is invalid");
    }

    let payload: { workspaceId: string; email: string; role?: string; exp: number };
    try {
      payload = JSON.parse(payloadText);
    } catch {
      throw new BadRequestException("Invitation token is malformed");
    }

    if (!payload.workspaceId || !payload.email || typeof payload.exp !== "number") {
      throw new BadRequestException("Invitation token is incomplete");
    }

    if (Date.now() > payload.exp) {
      throw new BadRequestException("Invitation token has expired");
    }

    return payload;
  }
  /**
   * Create a new workspace and add the owner as a team member
   */
  async createWorkspace(name: string, slug: string, ownerId: string) {
    const existing = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Workspace with slug '${slug}' already exists`);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        ownerId,
        teamMembers: {
          create: {
            userId: ownerId,
            role: "owner",
            inviteStatus: "accepted",
            joinedAt: new Date(),
          },
        },
      },
    });

    return workspace;
  }

  /**
   * Get workspace by ID
   */
  async getWorkspaceById(id: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID '${id}' not found`);
    }

    return workspace;
  }

  /**
   * Get workspace by slug
   */
  async getWorkspaceBySlug(slug: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug '${slug}' not found`);
    }

    return workspace;
  }

  /**
   * Update workspace name or logo
   */
  async updateWorkspace(id: string, data: { name?: string; logoUrl?: string }) {
    return prisma.workspace.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
      },
    });
  }

  /**
   * List all team members in a workspace
   */
  async getWorkspaceMembers(workspaceId: string) {
    return prisma.teamMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Invite a new member by email (creates team_members with pending status)
   */
  async inviteMember(workspaceId: string, email: string, role: string) {
    // Enforce the plan's seat limit server-side (throws 404 for unknown
    // workspaces and 409 when the plan's seat budget is exhausted).
    await this.entitlements.assertCanInviteSeat(workspaceId);

    // Check if user already exists in db by email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // If user doesn't exist, create a placeholder user synced with this email
      // This will be claimed when they register via Clerk
      user = await prisma.user.create({
        data: {
          email,
          clerkId: `pending_${Math.random().toString(36).slice(2)}`,
          name: email.split("@")[0],
        },
      });
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException(`User is already a member of this workspace`);
    }

    return prisma.teamMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role,
        inviteStatus: "pending",
        inviteEmail: email,
      },
    });
  }

  async acceptInvite(workspaceId: string, token: string, clerkUserId: string) {
    const payload = this.verifyInviteToken(token);

    if (payload.workspaceId !== workspaceId) {
      throw new ForbiddenException("Invitation token does not match this workspace");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      throw new NotFoundException("User account is not provisioned");
    }

    if (user.email.toLowerCase() !== payload.email.toLowerCase()) {
      throw new ForbiddenException("Invitation email does not match your account");
    }

    const member = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        inviteStatus: "pending",
        inviteEmail: payload.email,
      },
    });

    if (!member) {
      throw new NotFoundException("No pending invitation was found for this workspace and email");
    }

    const existingAcceptedMember = await prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        inviteStatus: "accepted",
      },
    });

    if (existingAcceptedMember) {
      return { success: true, workspaceId, memberId: existingAcceptedMember.id };
    }

    // Accepting consumes a seat — enforce the plan limit at the last
    // possible moment so pending invites cannot be used to bypass it.
    await this.entitlements.assertCanInviteSeat(workspaceId);

    const updatedMember = await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        userId: user.id,
        inviteStatus: "accepted",
        joinedAt: new Date(),
      },
    });

    return { success: true, workspaceId, memberId: updatedMember.id };
  }

  /**
   * Update a team member's role
   */
  async updateMemberRole(workspaceId: string, memberId: string, role: string) {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException(`Member not found in this workspace`);
    }

    if (member.role === "owner") {
      throw new ConflictException("Cannot change the role of the workspace owner");
    }

    return prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  /**
   * Remove a member from the workspace
   */
  async removeMember(workspaceId: string, memberId: string) {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException(`Member not found in this workspace`);
    }

    if (member.role === "owner") {
      throw new ConflictException("Cannot remove the owner of the workspace");
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  }
}
