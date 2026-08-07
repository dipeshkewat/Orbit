import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { CreatePostSchema, PlatformSchema } from "@orbit/types";

export function createPostsRouter(trpc: TrpcService) {
  return trpc.router({
    create: trpc.protectedProcedure
      .input(CreatePostSchema)
      .mutation(async ({ input }) => {
        // Implement simple Postgres db save
        return {
          id: "post_created_stub",
          content: input.content,
          platforms: input.platforms,
          scheduledAt: input.scheduledAt,
          status: "draft",
          createdAt: new Date(),
        };
      }),

    getByWorkspace: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          status: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Retrieve posts from database
        const posts = await ctx.prisma.post.findMany({
          where: {
            workspaceId: input.workspaceId,
            ...(input.status ? { status: input.status } : {}),
          },
          orderBy: { createdAt: "desc" },
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
          include: {
            postJobs: true,
          },
        });
        return posts;
      }),

    update: trpc.protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          content: z.string().optional(),
          scheduledAt: z.string().datetime().nullable().optional(),
          platforms: z.array(PlatformSchema).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const post = await ctx.prisma.post.update({
          where: { id: input.id },
          data: {
            ...(input.content !== undefined ? { content: input.content } : {}),
            ...(input.scheduledAt !== undefined
              ? { scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null }
              : {}),
            ...(input.platforms !== undefined ? { platforms: input.platforms } : {}),
          },
        });
        return post;
      }),

    delete: trpc.protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        await ctx.prisma.post.delete({
          where: { id: input.id },
        });
        return { success: true };
      }),

    schedule: trpc.protectedProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          scheduledAt: z.string().datetime(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const post = await ctx.prisma.post.update({
          where: { id: input.id },
          data: {
            status: "scheduled",
            scheduledAt: new Date(input.scheduledAt),
          },
        });
        return post;
      }),

    duplicate: trpc.protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const original = await ctx.prisma.post.findUnique({
          where: { id: input.id },
        });
        if (!original) throw new Error("Post not found");

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
        });
        return duplicate;
      }),
  });
}
