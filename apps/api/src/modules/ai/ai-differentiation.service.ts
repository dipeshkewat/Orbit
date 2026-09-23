import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { prisma } from "@orbit/db";
import { anthropic, CAPTION_MODEL, generateText, generateEmbedding, cosineSimilarity } from "@orbit/ai";

/**
 * P4 AI differentiation:
 *  - Brand voice: store example embeddings, retrieve the most similar
 *    examples for a topic, and condition caption generation on them.
 *  - Repurposing: turn one published post into platform-optimized variants.
 *  - Recommendations: mine PostMetrics to suggest what to do next.
 */
@Injectable()
export class AiDifferentiationService {
  private readonly logger = new Logger(AiDifferentiationService.name);

  // ── Brand voice ────────────────────────────────────────────────

  /**
   * Train brand voice: persist examples with embeddings for later retrieval.
   */
  async trainBrandVoice(workspaceId: string, examples: string[]) {
    const rows = [];
    for (const content of examples) {
      const embedding = await generateEmbedding(content);
      rows.push({ workspaceId, content, embedding });
    }
    await prisma.brandVoiceExample.createMany({ data: rows });
    return { trained: rows.length };
  }

  /**
   * Retrieve the most on-brand examples for a topic using cosine similarity
   * over stored embeddings. Falls back to the most recent examples when the
   * extension is unavailable.
   */
  async retrieveBrandVoiceExamples(workspaceId: string, topic: string, limit = 5) {
    try {
      const topicEmbedding = await generateEmbedding(topic);
      const all = await prisma.brandVoiceExample.findMany({
        where: { workspaceId },
        select: { id: true, content: true, embedding: true },
      });

      return all
        .map((e: { id: string; content: string; embedding: unknown }) => ({
          id: e.id,
          content: e.content,
          score: cosineSimilarity(
            topicEmbedding,
            (e.embedding as number[] | null) ?? [],
          ),
        }))
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, limit);
    } catch (err) {
      this.logger.warn(
        `Brand voice retrieval fell back to recency: ${(err as Error).message}`,
      );
      const recent = await prisma.brandVoiceExample.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return recent.map((e: { id: string; content: string }) => ({
        id: e.id,
        content: e.content,
        score: 0,
      }));
    }
  }

  // ── Repurposing ────────────────────────────────────────────────

  /**
   * Repurpose an existing post into platform-optimized variants using AI.
   */
  async repurposePost(input: {
    workspaceId: string;
    postId: string;
    targetPlatforms: string[];
  }): Promise<{
    variants: Record<string, { content: string; characterCount: number }>;
  }> {
    const post = await prisma.post.findFirst({
      where: { id: input.postId, workspaceId: input.workspaceId },
    });
    if (!post) {
      throw new NotFoundException(`Post '${input.postId}' not found in workspace`);
    }

    const brandExamples = await this.retrieveBrandVoiceExamples(
      input.workspaceId,
      post.content.slice(0, 500),
      3,
    );

    const platformList = input.targetPlatforms.join(", ");
    const prompt = `You are a social media content strategist. Repurpose the following source post into distinct variants, one per target platform: ${platformList}.

Source post:
"""
${post.content}
"""

${brandExamples.length > 0 ? `Match this brand voice:\n${brandExamples.map((e: { content: string }) => `- "${e.content}"`).join("\n")}\n` : ""}
Return a JSON object with platform names as keys. Each value should have "content" (the variant text) and "characterCount" (number of characters). Preserve the core message but adapt tone, length, hashtags, and formatting to each platform's conventions. Do NOT include markdown, just the JSON.`;

    const result = await generateText({
      model: anthropic(CAPTION_MODEL),
      prompt,
      maxTokens: 2500,
    });

    let variants: Record<string, { content: string; characterCount: number }>;
    try {
      variants = JSON.parse(result.text);
    } catch {
      // Fallback: same text everywhere, truncated per platform.
      variants = {};
      for (const platform of input.targetPlatforms) {
        variants[platform] = {
          content: post.content.slice(0, 2200),
          characterCount: Math.min(post.content.length, 2200),
        };
      }
    }

    return { variants };
  }

  // ── Recommendations ────────────────────────────────────────────

  /**
   * Performance-based recommendations: aggregate the workspace's recent
   * metrics, find what works, and produce concrete next actions.
   */
  async getRecommendations(workspaceId: string, limit = 5) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const metrics = await prisma.postMetric.findMany({
      where: { post: { workspaceId, publishedAt: { gte: since } } },
      select: {
        platform: true,
        likes: true,
        comments: true,
        shares: true,
        impressions: true,
        reach: true,
        engagementRate: true,
        post: { select: { content: true, publishedAt: true } },
      },
      orderBy: { engagementRate: "desc" },
    });

    if (metrics.length === 0) {
      return {
        summary: "Not enough published data yet — publish a few posts to unlock recommendations.",
        bestPlatform: null as string | null,
        topFormats: [] as string[],
        actions: [
          "Connect your social accounts and publish your first posts to unlock personalized recommendations.",
        ] as string[],
      };
    }

    // Platform aggregates
    const byPlatform = new Map<string, { reach: number; engagement: number; count: number }>();
    for (const m of metrics) {
      const agg = byPlatform.get(m.platform) ?? { reach: 0, engagement: 0, count: 0 };
      agg.reach += m.reach;
      agg.engagement += m.likes + m.comments + m.shares;
      agg.count += 1;
      byPlatform.set(m.platform, agg);
    }
    const ranked = [...byPlatform.entries()]
      .map(([platform, agg]) => ({
        platform,
        avgEngagementRate: agg.reach > 0 ? agg.engagement / agg.reach : 0,
        posts: agg.count,
      }))
      .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate);

    const bestPlatform = ranked[0]?.platform ?? null;
    const worstPlatform = ranked[ranked.length - 1]?.platform ?? null;

    // Top formats: what the highest-engagement posts have in common
    const topPosts = metrics.slice(0, 5);
    const hasHashtags = topPosts.filter((m) => /#\w+/.test(m.post.content)).length;
    const avgLength = Math.round(
      topPosts.reduce((sum, m) => sum + m.post.content.length, 0) / topPosts.length,
    );
    const topFormats = [
      hasHashtags >= topPosts.length / 2 ? "Posts with hashtags outperform" : "Posts without hashtags perform better",
      `Top posts average ~${avgLength} characters`,
    ];

    const actions = [
      `Double down on ${bestPlatform}: it has the highest engagement rate (${(ranked[0].avgEngagementRate * 100).toFixed(1)}%).`,
      worstPlatform && worstPlatform !== bestPlatform
        ? `Rework your ${worstPlatform} approach: it lags with ${(ranked[ranked.length - 1].avgEngagementRate * 100).toFixed(1)}% engagement.`
        : `Keep the consistent cadence on ${bestPlatform}.`,
      topFormats[0] + `.`,
    ].filter(Boolean);

    return {
      summary: `Analyzed ${metrics.length} post metrics from the last 30 days across ${ranked.length} platform(s).`,
      bestPlatform,
      topFormats,
      actions: actions.slice(0, limit),
    };
  }
}
