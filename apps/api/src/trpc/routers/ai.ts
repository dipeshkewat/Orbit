import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { GenerateCaptionSchema, PlatformSchema } from "@orbit/types";
import { AiService } from "../../modules/ai/ai.service";
import { AiDifferentiationService } from "../../modules/ai/ai-differentiation.service";

export function createAiRouter(
  trpc: TrpcService,
  aiService: AiService,
  aiDifferentiation: AiDifferentiationService,
) {
  return trpc.router({
    generateCaption: trpc.protectedProcedure
      .input(GenerateCaptionSchema.extend({ workspaceId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return aiService.generateCaption({
          workspaceId: input.workspaceId,
          topic: input.topic,
          tone: input.tone,
          platforms: input.platforms,
          brandVoiceEnabled: input.brandVoice,
        });
      }),

    generateImage: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          prompt: z.string().min(1),
          size: z.enum(["512", "1024"]).default("512"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return aiService.generateImage({
          workspaceId: input.workspaceId,
          prompt: input.prompt,
          size: input.size,
        });
      }),

    trainBrandVoice: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          examples: z.array(z.string().min(5)).min(1).max(20),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return aiDifferentiation.trainBrandVoice(input.workspaceId, input.examples);
      }),

    getBrandVoiceExamples: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          topic: z.string().min(1),
          limit: z.number().int().min(1).max(20).default(5),
        })
      )
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return aiDifferentiation.retrieveBrandVoiceExamples(
          input.workspaceId,
          input.topic,
          input.limit,
        );
      }),

    repurposePost: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          postId: z.string().uuid(),
          targetPlatforms: z.array(PlatformSchema).min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await trpc.authorizeWorkspaceMutation(ctx, input.workspaceId);
        return aiDifferentiation.repurposePost(input);
      }),

    getRecommendations: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
        })
      )
      .query(async ({ ctx, input }) => {
        await trpc.authorizeWorkspace(ctx, input.workspaceId);
        return aiDifferentiation.getRecommendations(input.workspaceId);
      }),
  });
}