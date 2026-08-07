import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { prisma } from "@orbit/db";

@Injectable()
export class WorkspaceService {
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
