import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  brandVoiceExample: {
    findMany: vi.fn(),
  },
  post: {
    findFirst: vi.fn(),
  },
  postMetric: {
    findMany: vi.fn(),
  },
  $executeRaw: vi.fn(),
  $queryRaw: vi.fn(),
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@orbit/ai", () => ({
  anthropic: vi.fn(() => ({})),
  CAPTION_MODEL: "claude-sonnet-4-6",
  generateText: vi.fn(),
  generateEmbedding: vi.fn(),
}));

import { AiDifferentiationService } from "./ai-differentiation.service";
import { generateEmbedding, generateText } from "@orbit/ai";

describe("AiDifferentiationService", () => {
  const service = new AiDifferentiationService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trainBrandVoice", () => {
    test("embeds and persists every example via parameterized raw SQL", async () => {
      prismaMock.$executeRaw.mockResolvedValue(1);
      (generateEmbedding as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(new Array(1536).fill(0.1))
        .mockResolvedValueOnce(new Array(1536).fill(0.2));

      const result = await service.trainBrandVoice("ws-1", ["post a", "post b"]);

      expect(result).toEqual({ trained: 2 });
      expect(prismaMock.$executeRaw).toHaveBeenCalledTimes(2);
    });

    test("succeeds with zero examples without touching the database", async () => {
      const result = await service.trainBrandVoice("ws-1", []);

      expect(result).toEqual({ trained: 0 });
      expect(prismaMock.$executeRaw).not.toHaveBeenCalled();
    });
  });

  describe("retrieveBrandVoiceExamples", () => {
    test("ranks examples by pgvector cosine distance", async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue([1, 0, 0]);
      prismaMock.$queryRaw.mockResolvedValue([
        { id: "a", content: "alpha", distance: 0.05 },
        { id: "c", content: "gamma", distance: 0.4 },
      ]);

      const results = await service.retrieveBrandVoiceExamples("ws-1", "topic", 2);

      expect(results).toEqual([
        { id: "a", content: "alpha", score: 0.95 },
        { id: "c", content: "gamma", score: 0.6 },
      ]);
    });

    test("falls back to recency when the vector query throws", async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("embedder down"),
      );
      prismaMock.brandVoiceExample.findMany.mockResolvedValue([
        { id: "z", content: "recent" },
      ]);

      const results = await service.retrieveBrandVoiceExamples("ws-1", "topic");

      expect(results).toEqual([{ id: "z", content: "recent", score: 0 }]);
      expect(prismaMock.brandVoiceExample.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" }, take: 5 }),
      );
    });
  });

  describe("repurposePost", () => {
    test("generates per-platform variants from the source post", async () => {
      prismaMock.post.findFirst.mockResolvedValue({
        id: "p1",
        workspaceId: "ws-1",
        content: "Big launch announcement!",
      });
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue([1, 0, 0]);
      prismaMock.$queryRaw.mockResolvedValue([]);
      (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
        text: JSON.stringify({
          twitter: { content: "Big launch! 🚀", characterCount: 15 },
          linkedin: { content: "We are thrilled to announce our launch.", characterCount: 42 },
        }),
      });

      const { variants } = await service.repurposePost({
        workspaceId: "ws-1",
        postId: "p1",
        targetPlatforms: ["twitter", "linkedin"],
      });

      expect(variants.twitter.content).toBe("Big launch! 🚀");
      expect(variants.linkedin.characterCount).toBe(42);
    });

    test("throws NotFound when the post belongs to another workspace", async () => {
      prismaMock.post.findFirst.mockResolvedValue(null);

      await expect(
        service.repurposePost({
          workspaceId: "ws-other",
          postId: "p1",
          targetPlatforms: ["twitter"],
        }),
      ).rejects.toMatchObject({ response: { statusCode: 404 } });
    });

    test("falls back to truncated source content when the AI returns invalid JSON", async () => {
      prismaMock.post.findFirst.mockResolvedValue({
        id: "p1",
        workspaceId: "ws-1",
        content: "x".repeat(3000),
      });
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue([1, 0, 0]);
      prismaMock.$queryRaw.mockResolvedValue([]);
      (generateText as ReturnType<typeof vi.fn>).mockResolvedValue({
        text: "not json at all",
      });

      const { variants } = await service.repurposePost({
        workspaceId: "ws-1",
        postId: "p1",
        targetPlatforms: ["twitter"],
      });

      expect(variants.twitter.characterCount).toBe(2200);
    });
  });

  describe("getRecommendations", () => {
    test("returns the onboarding message when there is no metric data", async () => {
      prismaMock.postMetric.findMany.mockResolvedValue([]);

      const result = await service.getRecommendations("ws-1");

      expect(result.bestPlatform).toBeNull();
      expect(result.actions[0]).toContain("Connect your social accounts");
    });

    test("ranks platforms by engagement rate and proposes actions", async () => {
      prismaMock.postMetric.findMany.mockResolvedValue([
        {
          platform: "instagram",
          likes: 100, comments: 10, shares: 5, impressions: 1000, reach: 900,
          engagementRate: 0.127,
          post: { content: "great post with #hashtags", publishedAt: new Date() },
        },
        {
          platform: "twitter",
          likes: 5, comments: 1, shares: 0, impressions: 2000, reach: 1800,
          engagementRate: 0.003,
          post: { content: "meh", publishedAt: new Date() },
        },
      ]);

      const result = await service.getRecommendations("ws-1");

      expect(result.bestPlatform).toBe("instagram");
      expect(result.actions[0]).toContain("instagram");
      expect(result.actions.some((a: string) => a.includes("twitter"))).toBe(true);
    });
  });
});
