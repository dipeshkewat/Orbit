import { TrpcService } from "../trpc.service";
import { CreatePostSchema, PlatformSchema } from "@orbit/types";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { PostsService } from "../../modules/posts/posts.service";

const PostIdSchema = z.object({
  workspaceId: z.string().uuid(),
  id: z.string().uuid(),
});

const postSelect = {
  id: true,
  workspaceId: true,
  createdById: true,
  content: true,
  mediaUrls: true,
  platformOverrides: true,
  platforms: true,
  scheduledAt: true,
  publishedAt: true,
  status: true,
  approvalStatus: true,
  approvalNote: true,
  isRecurring: true,
  recurringRule: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function createPostsRouter(trpc: TrpcService, postsService: PostsService) {
  return trpc.router({
    create: trpc.protectedProcedure
      .input(CreatePostSchema)
      .mutation(async ({ input, ctx }) => {
        const access = await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        void access;
        return postsService.createPost(access.userId, input.workspaceId, input);
      }),

    getByWorkspace: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          status: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        const posts = await ctx.prisma.post.findMany({
          where: {
            workspaceId: input.workspaceId,
            ...(input.status ? { status: input.status } : {}),
          },
          orderBy: { createdAt: "desc" },
          select: postSelect,
        });
        return posts;
      }),

    getCalendar: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          from: z.string().datetime(),
          to: z.string().datetime(),
        })
      )
      .query(async ({ input, ctx }) => {
        const posts = await ctx.prisma.post.findMany({
          where: {
            workspaceId: input.workspaceId,
            scheduledAt: {
              gte: new Date(input.from),
              lte: new Date(input.to),
            },
          },
          select: { ...postSelect, postJobs: true },
        });
        return posts;
      }),

    update: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          id: z.string().uuid(),
          content: z.string().optional(),
          scheduledAt: z.string().datetime().nullable().optional(),
          platforms: z.array(PlatformSchema).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const post = await ctx.prisma.post.update({
          where: { id: input.id, workspaceId: input.workspaceId },
          data: {
            ...(input.content !== undefined ? { content: input.content } : {}),
            ...(input.scheduledAt !== undefined
              ? { scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null }
              : {}),
            ...(input.platforms !== undefined ? { platforms: input.platforms } : {}),
          },
        });
        return { ...post, workspaceId: input.workspaceId };
      }),

    delete: trpc.protectedProcedure
      .input(PostIdSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const result = await ctx.prisma.post.deleteMany({
          where: { id: input.id, workspaceId: input.workspaceId },
        });
        if (result.count !== 1) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
        }
        return { id: input.id, workspaceId: input.workspaceId, status: "deleted" as const };
      }),

    schedule: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          id: z.string().uuid(),
          scheduledAt: z.string().datetime(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const post = await ctx.prisma.post.update({
          where: { id: input.id, workspaceId: input.workspaceId },
          data: {
            status: "scheduled",
            scheduledAt: new Date(input.scheduledAt),
          },
        });
        return post;
      }),

    duplicate: trpc.protectedProcedure
      .input(PostIdSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const original = await ctx.prisma.post.findFirst({
          where: { id: input.id, workspaceId: input.workspaceId },
        });
        if (!original) throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });

        const duplicate = await ctx.prisma.post.create({
          data: {
            workspaceId: original.workspaceId,
            createdById: original.createdById,
            content: original.content,
            mediaUrls: original.mediaUrls ?? [],
            platformOverrides: original.platformOverrides ?? {},
            platforms: original.platforms,
            status: "draft",
          },
          select: postSelect,
        });
        return duplicate;
      }),
  });
}
