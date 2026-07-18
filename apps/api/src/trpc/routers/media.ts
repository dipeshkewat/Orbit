import { z } from "zod";
import { TrpcService } from "../trpc.service";

export function createMediaRouter(trpc: TrpcService) {
  return trpc.router({
    getUploadUrl: trpc.protectedProcedure
      .input(
        z.object({
          filename: z.string(),
          contentType: z.string(),
          sizeBytes: z.number().max(524288000), // 500MB
        })
      )
      .mutation(async ({ input }) => {
        void input;
        return {
          uploadId: "upl_mock_id",
          uploadUrl: "https://upload.socialsphear.com/presigned/mock_upload_key",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
      }),

    confirmUpload: trpc.protectedProcedure
      .input(z.object({ uploadId: z.string() }))
      .mutation(async ({ input }) => {
        void input;
        return {
          id: "med_mock_id",
          url: "https://cdn.socialsphear.com/media/ws_mock/uploaded-image.jpg",
          variants: {
            instagram_square: "https://cdn.socialsphear.com/media/ws_mock/uploaded-image_1080x1080.jpg",
            twitter_landscape: "https://cdn.socialsphear.com/media/ws_mock/uploaded-image_1200x675.jpg",
          },
        };
      }),

    listMediaLibrary: trpc.protectedProcedure.query(async ({ ctx }) => {
      const media = await ctx.prisma.mediaFile.findMany({
        orderBy: { createdAt: "desc" },
      });
      return media;
    }),

    deleteMedia: trpc.protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        await ctx.prisma.mediaFile.delete({
          where: { id: input.id },
        });
        return { success: true };
      }),
  });
}
