import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@orbit/db";
import type { Prisma } from "@prisma/client";
import { CreatePostInput } from "@orbit/types";
import { PostSchedulerService } from "../scheduler/post-scheduler.service";
import { canScheduleApproval } from "./approval-policy";

@Injectable()
export class PostsService {
  constructor(private readonly schedulerService: PostSchedulerService) {}

  /**
   * Create a new post as draft or schedule it if scheduledAt is provided
   */
  async createPost(userId: string, workspaceId: string, input: CreatePostInput) {
    // Check if the user is a member of the workspace
    const member = await prisma.teamMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member) {
      throw new BadRequestException("User is not a member of this workspace");
    }

    const socialAccounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: input.socialAccountIds },
        workspaceId,
        status: "active",
      },
      select: { id: true, platform: true },
    });
    if (
      socialAccounts.length !== input.socialAccountIds.length ||
      socialAccounts.some((account) => !input.platforms.includes(account.platform as (typeof input.platforms)[number]))
    ) {
      throw new BadRequestException("Selected social accounts do not match this workspace and post");
    }

    const post = await prisma.$transaction(async (transaction) => {
      const createdPost = await transaction.post.create({
        data: {
          workspaceId,
          createdById: userId,
          content: input.content,
          mediaUrls: input.mediaUrls ?? [],
          platforms: input.platforms,
          platformOverrides: input.platformOverrides ?? {},
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          status: input.scheduledAt ? "scheduled" : "draft",
          approvalStatus: "none",
        },
      });

      // Keep the post and its delivery jobs atomic so scheduling cannot observe a partial post.
      await Promise.all(
        socialAccounts.map((socialAccount) =>
          transaction.postJob.create({
            data: {
              postId: createdPost.id,
              socialAccountId: socialAccount.id,
              platform: socialAccount.platform,
              status: "pending",
            },
          }),
        ),
      );
      return createdPost;
    });

    // Queue in BullMQ if scheduledAt is set
    if (post.scheduledAt) {
      await this.schedulerService.schedulePost(post.id, post.scheduledAt);
    }

    return post;
  }

  /**
   * Retrieve a specific post with its jobs
   */
  async getPostById(workspaceId: string, id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postJobs: {
          include: {
            socialAccount: {
              select: {
                username: true,
                displayName: true,
                platform: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException(`Post not found`);
    }

    return post;
  }

  /**
   * List posts for a workspace with optional status filter
   */
  async listPosts(workspaceId: string, status?: string) {
    return prisma.post.findMany({
      where: {
        workspaceId,
        ...(status ? { status } : {}),
      },
      include: {
        postJobs: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * List scheduled posts in a date range for the calendar view
   */
  async getCalendarPosts(workspaceId: string, from: Date, to: Date) {
    return prisma.post.findMany({
      where: {
        workspaceId,
        scheduledAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        postJobs: true,
      },
    });
  }

  /**
   * Update a post (draft or scheduled)
   */
  async updatePost(
    workspaceId: string,
    id: string,
    data: {
      content?: string;
      mediaUrls?: string[];
      platforms?: string[];
      scheduledAt?: string | null;
      platformOverrides?: Prisma.InputJsonValue;
    }
  ) {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException("Post not found");
    }

    if (post.status === "published" || post.status === "publishing") {
      throw new BadRequestException("Cannot update a post that is already publishing or published");
    }

    const scheduledAtDate =
      data.scheduledAt !== undefined
        ? data.scheduledAt
          ? new Date(data.scheduledAt)
          : null
        : post.scheduledAt;

    const status =
      data.scheduledAt !== undefined
        ? data.scheduledAt
          ? "scheduled"
          : "draft"
        : post.status;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.mediaUrls !== undefined ? { mediaUrls: data.mediaUrls } : {}),
        ...(data.platforms !== undefined ? { platforms: data.platforms } : {}),
        ...(data.platformOverrides !== undefined ? { platformOverrides: data.platformOverrides } : {}),
        scheduledAt: scheduledAtDate,
        status,
      },
    });

    if (status === "scheduled" && scheduledAtDate) {
      await this.schedulerService.schedulePost(updatedPost.id, scheduledAtDate);
    } else if (status === "draft") {
      await this.schedulerService.cancelScheduledPost(updatedPost.id);
    }

    return updatedPost;
  }

  async schedulePost(workspaceId: string, id: string, scheduledAt: Date) {
    const post = await prisma.post.findFirst({
      where: { id, workspaceId },
    });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    if (post.status === "published" || post.status === "publishing") {
      throw new BadRequestException("Cannot schedule a post that is already publishing or published");
    }
    if (!canScheduleApproval(post.approvalStatus)) {
      throw new BadRequestException("This post must be approved before it can be scheduled");
    }

    const scheduledPost = await prisma.post.update({
      where: { id: post.id },
      data: { status: "scheduled", scheduledAt },
    });
    await this.schedulerService.schedulePost(scheduledPost.id, scheduledAt);
    return scheduledPost;
  }

  async submitForApproval(workspaceId: string, id: string) {
    const post = await prisma.post.findFirst({ where: { id, workspaceId } });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    if (post.status === "published" || post.status === "publishing") {
      throw new BadRequestException("Published posts cannot be submitted for approval");
    }
    return prisma.post.update({
      where: { id: post.id },
      data: { approvalStatus: "pending", approvalNote: null },
    });
  }

  async approvePost(workspaceId: string, id: string) {
    const post = await prisma.post.findFirst({ where: { id, workspaceId } });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    return prisma.post.update({
      where: { id: post.id },
      data: { approvalStatus: "approved", approvalNote: null },
    });
  }

  async rejectPost(workspaceId: string, id: string, note: string) {
    const post = await prisma.post.findFirst({ where: { id, workspaceId } });
    if (!post) {
      throw new NotFoundException("Post not found");
    }
    return prisma.post.update({
      where: { id: post.id },
      data: { approvalStatus: "rejected", approvalNote: note },
    });
  }

  async addComment(workspaceId: string, postId: string, userId: string, text: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new BadRequestException("Comment text is required");
    }

    return prisma.activityLog.create({
      data: {
        workspaceId,
        userId,
        action: "post.comment.added",
        entityType: "post",
        entityId: postId,
        metadata: { text: trimmedText },
      },
    });
  }

  async getComments(workspaceId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    return prisma.activityLog.findMany({
      where: {
        workspaceId,
        action: "post.comment.added",
        entityType: "post",
        entityId: postId,
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async assignPost(workspaceId: string, postId: string, assigneeId: string | null, actorId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, workspaceId },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (assigneeId) {
      const assignee = await prisma.teamMember.findFirst({
        where: { workspaceId, userId: assigneeId, inviteStatus: "accepted" },
        select: { userId: true },
      });
      if (!assignee) {
        throw new BadRequestException("Assignee is not an active workspace member");
      }
    }

    return prisma.$transaction(async (transaction) => {
      const updatedPost = await transaction.post.update({
        where: { id: postId },
        data: { assignedToId: assigneeId },
      });

      await transaction.activityLog.create({
        data: {
          workspaceId,
          userId: actorId,
          action: assigneeId ? "post.assigned" : "post.unassigned",
          entityType: "post",
          entityId: postId,
          metadata: { assigneeId },
        },
      });

      return updatedPost;
    });
  }

  async getActivity(workspaceId: string, limit = 50) {
    return prisma.activityLog.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: Math.min(Math.max(limit, 1), 100),
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * Delete a post
   */
  async deletePost(workspaceId: string, id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post || post.workspaceId !== workspaceId) {
      throw new NotFoundException("Post not found");
    }

    if (post.status === "published" || post.status === "publishing") {
      throw new BadRequestException("Cannot delete a post that is already publishing or published");
    }

    // Cancel from delayed queue
    await this.schedulerService.cancelScheduledPost(id);

    await prisma.post.delete({
      where: { id },
    });

    return { success: true };
  }
}
