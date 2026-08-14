import { Injectable, Logger } from "@nestjs/common";
import { anthropic, CAPTION_MODEL, generateText } from "@orbit/ai";
import { prisma } from "@orbit/db";

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  /**
   * Generate platform-optimized captions for a given topic.
   * Deducts AI credits from the workspace's monthly allocation.
   */
  async generateCaption(input: {
    workspaceId: string;
    topic: string;
    tone: string;
    platforms: string[];
    brandVoiceEnabled?: boolean;
  }): Promise<{
    captions: Record<string, { content: string; characterCount: number }>;
    creditsUsed: number;
    creditsRemaining: number;
  }> {
    // Check credits
    const credits = await this.getOrCreateCredits(input.workspaceId);
    const cost = input.platforms.length; // 1 credit per platform
    if (credits.creditsUsed + cost > credits.planAllowance) {
      throw new Error(
        `Insufficient AI credits. Used: ${credits.creditsUsed}/${credits.planAllowance}. Required: ${cost}`
      );
    }

    // Build brand voice context if enabled
    let brandVoiceContext = "";
    if (input.brandVoiceEnabled) {
      const examples = await prisma.brandVoiceExample.findMany({
        where: { workspaceId: input.workspaceId },
        take: 5,
      });
      if (examples.length > 0) {
        brandVoiceContext = `\n\nBrand voice examples to emulate:\n${examples.map((e: { content: string }) => `- "${e.content}"`).join("\n")}`;
      }
    }

    const platformLimits: Record<string, number> = {
      instagram: 2200,
      twitter: 280,
      linkedin: 3000,
      facebook: 63206,
      tiktok: 2200,
      threads: 500,
      pinterest: 500,
      youtube: 5000,
    };

    const platformList = input.platforms
      .map((p) => `${p} (max ${platformLimits[p.toLowerCase()] || 2200} chars)`)
      .join(", ");

    const prompt = `You are a social media marketing expert. Generate engaging captions for the following platforms: ${platformList}.

Topic: ${input.topic}
Tone: ${input.tone}
${brandVoiceContext}

Return a JSON object with platform names as keys. Each value should have "content" (the caption text with relevant hashtags) and "characterCount" (number of characters).

Rules:
- Respect each platform's character limit
- Include 3-5 relevant hashtags for Instagram, 1-2 for Twitter
- LinkedIn should be professional, Twitter concise, Instagram visual
- Do NOT include markdown formatting, just the JSON`;

    try {
      const result = await generateText({
        model: anthropic(CAPTION_MODEL),
        prompt,
        maxTokens: 2000,
      });

      // Parse the AI response
      let captions: Record<string, { content: string; characterCount: number }>;
      try {
        captions = JSON.parse(result.text);
      } catch {
        // If AI didn't return valid JSON, create a fallback structure
        captions = {};
        for (const platform of input.platforms) {
          captions[platform] = {
            content: result.text.slice(0, platformLimits[platform.toLowerCase()] || 2200),
            characterCount: result.text.length,
          };
        }
      }

      // Deduct credits
      await prisma.aiCredit.update({
        where: { id: credits.id },
        data: { creditsUsed: credits.creditsUsed + cost },
      });

      return {
        captions,
        creditsUsed: cost,
        creditsRemaining: credits.planAllowance - credits.creditsUsed - cost,
      };
    } catch (err) {
      this.logger.error(`AI caption generation failed: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Suggest hashtags for a given topic using AI
   */
  async suggestHashtags(topic: string): Promise<string[]> {
    try {
      const result = await generateText({
        model: anthropic(CAPTION_MODEL),
        prompt: `Suggest 10 relevant, trending hashtags for the topic: "${topic}". Return them as a JSON array of strings. No markdown.`,
        maxTokens: 200,
      });

      try {
        return JSON.parse(result.text);
      } catch {
        // Parse hashtags from raw text
        const matches = result.text.match(/#\w+/g);
        return matches || ["#socialmedia", "#marketing", "#content"];
      }
    } catch (err) {
      this.logger.error(`Hashtag suggestion failed: ${(err as Error).message}`);
      return ["#socialmedia", "#marketing", "#content", "#strategy"];
    }
  }

  /**
   * Suggest the best posting times for a given platform.
   * Returns ISO 8601 datetime strings.
   */
  async suggestBestTimes(platform: string): Promise<string[]> {
    // Static best-time data based on industry research
    const bestTimes: Record<string, string[]> = {
      instagram: ["09:00", "12:00", "17:00"],
      twitter: ["08:00", "12:00", "17:00", "21:00"],
      linkedin: ["07:30", "12:00", "17:30"],
      facebook: ["09:00", "13:00", "16:00"],
      tiktok: ["07:00", "10:00", "19:00"],
    };

    const times = bestTimes[platform.toLowerCase()] || ["09:00", "12:00", "18:00"];
    const today = new Date();
    // Return times as ISO strings for tomorrow
    return times.map((time) => {
      const [hours, minutes] = time.split(":");
      const dt = new Date(today);
      dt.setDate(dt.getDate() + 1);
      dt.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return dt.toISOString();
    });
  }

  /**
   * Generate an image using fal.ai Flux models.
   * Deducts AI credits: 10 for 512x512, 20 for 1024x1024.
   */
  async generateImage(input: {
    workspaceId: string;
    prompt: string;
    size: "512" | "1024";
  }): Promise<{
    imageUrl: string;
    creditsUsed: number;
    creditsRemaining: number;
  }> {
    const credits = await this.getOrCreateCredits(input.workspaceId);
    const cost = input.size === "512" ? 10 : 20;

    if (credits.creditsUsed + cost > credits.planAllowance) {
      throw new Error(
        `Insufficient AI credits. Used: ${credits.creditsUsed}/${credits.planAllowance}. Required: ${cost}`
      );
    }

    try {
      let imageUrl = "";
      const falKey = process.env.FAL_KEY;

      if (falKey && falKey !== "xxx") {
        // Send request to fal.ai Flux endpoint
        const response = await fetch("https://queue.fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt: input.prompt,
            image_size: input.size === "512" ? "square_hd" : "square",
            sync_mode: true,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          imageUrl = result.images?.[0]?.url || "";
        }
      }

      // Fallback/Mock generator for local testing
      if (!imageUrl) {
        imageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=${input.size}&q=80&sig=${Math.floor(Math.random() * 1000)}`;
      }

      // Deduct credits
      await prisma.aiCredit.update({
        where: { id: credits.id },
        data: { creditsUsed: credits.creditsUsed + cost },
      });

      return {
        imageUrl,
        creditsUsed: cost,
        creditsRemaining: credits.planAllowance - credits.creditsUsed - cost,
      };
    } catch (err) {
      this.logger.error(`AI image generation failed: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Get or create the AI credits record for the current billing period
   */
  private async getOrCreateCredits(workspaceId: string) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let credits = await prisma.aiCredit.findUnique({
      where: {
        workspaceId_month: { workspaceId, month },
      },
    });

    if (!credits) {
      // Get workspace plan to determine credit limit
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      const planLimits: Record<string, number> = {
        free: 20,
        creator: 200,
        pro: 1000,
        agency: 5000,
      };

      credits = await prisma.aiCredit.create({
        data: {
          workspaceId,
          month,
          creditsUsed: 0,
          planAllowance: planLimits[workspace?.plan || "free"] || 20,
        },
      });
    }

    return credits;
  }
}
