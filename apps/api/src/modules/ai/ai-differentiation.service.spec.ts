import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  brandVoiceExample: {
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  post: {
    findFirst: vi.fn(),
  },
  postMetric: {
    findMany: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@orbit/ai", () => ({
  anthropic: vi.fn(() => ({})),
  CAPTION_MODEL: "claude-sonnet-4-6",
  generateText: vi.fn(),
  generateEmbedding: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

import { AiDifferentiationService } from "./ai-differentiation.service";
import { generateEmbedding, cosineSimilarity, generateText } from "@orbit/ai";

describe("AiDifferentiationService", () => {
  const service = new AiDifferentiationService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("trainBrandVoice", () => createTrainTests(service));

  describe("retrieveBrandVoiceExamples", () => createRetrievalTests(service));

  describe("repurposePost", () => createRepurposeTests(service));

  describe("getRecommendations", () => createRecommendationTests(service));
});

function createTrainTests(service: AiDifferentiationService) {
  return () => {
    test("embeds and persists every example", async () => {
      prismaMock.brandVoiceExample.createMany.mockResolvedValue({ count: 2 });
      (generateEmbedding as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(new Array(1536).fill(0.1))
        .mockResolvedValueOnce(new Array(1536).fill(0.2));

      const result = await service.trainBrandVoice("ws-1", ["post a", "post b"]);

      expect(result).toEqual({ trained: 2 });
      expect(prismaMock.brandVoiceExample.createMany).toHaveBeenCalledWith({
        data: [
          { workspaceId: "ws-1", content: "post a", embedding: expect.any(Array) },
          { workspaceId: "ws-1", content: "post b", embedding: expect.any(Array) },
        ],
      });
    });

    test("succeeds with zero examples", async () => {
      const result = await service.trainBrandVoice("ws-1", []);
      expect(result).toEqual({ trained: 0 });
      expect(prismaMock.brandVoiceExample.createMany).not.toHaveBeenCalled();
    });
  };
}

function createRetrievalTests(service: AiDifferentiationService) {
  return () => {
    test("ranks examples by cosine similarity to the topic", async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue([1, 0, 0]);
      prismaMock.brandVoiceExample.findMany.mockResolvedValue([
        { id: "a", content: "alpha", embedding: [1, 0, 0] },
        { id: "b", content: "beta", embedding: [0, 1, 0] },
        { id: "c", content: "gamma", embedding: [0.7, 0.7, 0] },
      ]);
      (cosineSimilarity as ReturnType<typeof vi.fn>).mockImplementation(
        (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1],
      );

      const results = await service.retrieveBrandVoiceExamples("ws-1", "topic", 2);

      expect(results.map((r: { id: string }) => r.id)).toEqual(["a", "c"]);
    });

    test("falls back to recency when embedding retrieval throws", async () => {
      (generateEmbedding as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("embedder down"),
      );
      prismaMock.brandVoiceExample.findMany
        .mockResolvedValueOnce([{ id: "z", content: "recent", }])
        .mockResolvedValueOnce([{ id: "z", content: "recent" }]);

      const results = await service.retrieveBrandVoiceExamples("ws-1", "topic");

      expect(results).toEqual([{ id: "z", content: "recent", score: 0 }]);
    });
  };
}

function createRepurposeTests(service: AiDifferentiationService) {
  return () => {
    test("generates per-platform variants from the source post", async () => {
      prismaMock.post.findFirst.mockResolvedValue({
        id: "p1",
        workspaceId: "ws-1",
        content: "Big launch announcement!",
      });
      (generateEmbedding as ReturnType<typeof vi.fn>).mockResolvedValue([1, 0, 0]);
      prismaMock.brandVoiceExample.findMany.mockResolvedValue([]);
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
      prismaMock.brandVoiceExample.findMany.mockResolvedValue([]);
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
  };
}

function createRecommendationTests(service: AiDifferentiationService) {
  return () => {
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
  };
}
