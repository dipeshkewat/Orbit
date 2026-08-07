import { z } from "zod";
import { TrpcService } from "../trpc.service";
import { GenerateCaptionSchema, PlatformSchema } from "@orbit/types";

export function createAiRouter(trpc: TrpcService) {
  return trpc.router({
    generateCaption: trpc.protectedProcedure
      .input(GenerateCaptionSchema)
      .mutation(async ({ input }) => {
        // Simple mock caption output
        return {
          captions: input.platforms.reduce((acc, platform) => {
            acc[platform] = {
              content: `Here is a platform-optimized caption for ${platform} about: ${input.topic} #awesome #ai`,
              characterCount: 100,
              platformLimit: 2200,
              hashtagsIncluded: 2,
            };
            return acc;
          }, {} as Record<string, any>),
          creditsUsed: input.platforms.length,
          creditsRemaining: 950,
        };
      }),

    generateImage: trpc.protectedProcedure
      .input(
        z.object({
          prompt: z.string(),
          aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:5"]).default("1:1"),
        })
      )
      .mutation(async ({ input }) => {
        void input;
        return {
          imageUrl: "https://cdn.orbit.com/media/ai_mock_generated.png",
          creditsUsed: 10,
        };
      }),

    trainBrandVoice: trpc.protectedProcedure
      .input(
        z.object({
          workspaceId: z.string().uuid(),
          examples: z.array(z.string().min(5)).min(5).max(20),
        })
      )
      .mutation(async () => {
        return { success: true };
      }),

    suggestHashtags: trpc.protectedProcedure
      .input(
        z.object({
          topic: z.string(),
        })
      )
      .query(async ({ input }) => {
        void input;
        return {
          hashtags: ["#orbit", "#marketing", "#contentcreator", "#socialmedia"],
        };
      }),

    suggestBestTime: trpc.protectedProcedure
      .input(
        z.object({
          platform: PlatformSchema,
        })
      )
      .query(async ({ input }) => {
        void input;
        return {
          suggestedTimes: ["2026-07-18T09:00:00Z", "2026-07-18T18:00:00Z"],
        };
      }),
  });
}
