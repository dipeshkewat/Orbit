import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { MediaService } from "../../modules/media/media.service";

const WorkspaceMediaInputSchema = z.object({
  workspaceId: z.string().uuid(),
});

const MediaItemInputSchema = WorkspaceMediaInputSchema.extend({
  id: z.string().uuid(),
});

const UploadInputSchema = WorkspaceMediaInputSchema.extend({
  filename: z.string().trim().min(1).max(255),
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
  ]),
  sizeBytes: z.number().int().positive().max(524288000),
});

export function createMediaRouter(trpc: TrpcService, mediaService: MediaService) {
  return trpc.router({
    getUploadUrl: trpc.protectedProcedure
      .input(UploadInputSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return mediaService.getUploadUrl(
          input.workspaceId,
          input.filename,
          input.contentType,
          input.sizeBytes,
        );
      }),

    confirmUpload: trpc.protectedProcedure
      .input(MediaItemInputSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return mediaService.confirmUpload(input.workspaceId, input.id);
      }),

    listMediaLibrary: trpc.protectedProcedure
      .input(WorkspaceMediaInputSchema)
      .query(async ({ input, ctx }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return mediaService.listMediaLibrary(input.workspaceId);
      }),

    deleteMedia: trpc.protectedProcedure
      .input(MediaItemInputSchema)
      .mutation(async ({ input, ctx }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        const result = await mediaService.deleteMedia(input.workspaceId, input.id);
        if (!result.success) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Media not found" });
        }
        return { id: input.id, workspaceId: input.workspaceId, status: "deleted" as const };
      }),
  });
}
