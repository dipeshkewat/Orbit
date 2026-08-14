import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "@orbit/db";
import { CreatePostInput } from "@orbit/types";
import { PostSchedulerService } from "../scheduler/post-scheduler.service";

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

    const post = await prisma.post.create({
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

    // Create individual post jobs for each platform
    const jobsData = input.socialAccountIds.map((socialAccountId: string) => {
      return prisma.postJob.create({
        data: {
          postId: post.id,
          socialAccountId,
          platform: input.platforms[0],
          status: "pending",
        },
      });
    });

    await Promise.all(jobsData);

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
      platformOverrides?: any;
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
