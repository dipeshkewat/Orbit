import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  postMetric: {
    findMany: vi.fn(),
  },
  post: {
    findMany: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

import { AnalyticsService } from "./analytics.service";
import { AnalyticsIngestService } from "./analytics-ingest.service";

describe("AnalyticsService", () => {
  const service = new AnalyticsService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("aggregates metrics only from published posts in the workspace and date range", async () => {
    prismaMock.postMetric.findMany.mockResolvedValue([
      {
        likes: 10,
        comments: 2,
        shares: 1,
        impressions: 100,
        reach: 80,
        clicks: 4,
        saves: 3,
        engagementRate: 2.5,
        post: { publishedAt: new Date("2026-09-10"), status: "published" },
      },
      {
        likes: 5,
        comments: 1,
        shares: 0,
        impressions: 40,
        reach: 30,
        clicks: 2,
        saves: 1,
        engagementRate: 1.5,
        post: { publishedAt: new Date("2026-09-11"), status: "published" },
      },
    ]);

    await expect(
      service.getWorkspaceOverview(
        "workspace-1",
        new Date("2026-09-01"),
        new Date("2026-09-30"),
      ),
    ).resolves.toMatchObject({
      likes: 15,
      comments: 3,
      impressions: 140,
      totalPosts: 2,
      avgEngagementRate: 2,
    });

    expect(prismaMock.postMetric.findMany).toHaveBeenCalledWith({
      where: {
        post: {
          workspaceId: "workspace-1",
          publishedAt: {
            gte: new Date("2026-09-01"),
            lte: new Date("2026-09-30"),
          },
        },
      },
      include: { post: { select: { publishedAt: true, status: true } } },
    });
  });

  test("returns post analytics scoped to the workspace", async () => {
    prismaMock.post.findMany.mockResolvedValue([
      {
        id: "post-1",
        content: "A published post with a long body that should be shortened for analytics output.",
        publishedAt: new Date("2026-09-10"),
        metrics: [
          { platform: "linkedin", likes: 10, comments: 2, shares: 1, impressions: 100, engagementRate: 2.5 },
        ],
      },
    ]);

    await expect(service.getPostAnalytics("workspace-1", { limit: 5 })).resolves.toEqual([
      {
        id: "post-1",
        content: "A published post with a long body that should be shortened for analytics output.",
        publishedAt: new Date("2026-09-10"),
        platforms: [
          { platform: "linkedin", likes: 10, comments: 2, shares: 1, impressions: 100, engagementRate: 2.5 },
        ],
        totalEngagement: 13,
      },
    ]);

    expect(prismaMock.post.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "workspace-1", status: "published" },
      include: { metrics: true },
      orderBy: { publishedAt: "desc" },
      take: 5,
      skip: 0,
    });
  });

  test("builds a monthly reach series from stored metrics", async () => {
    prismaMock.postMetric.findMany.mockResolvedValue([
      {
        platform: "instagram",
        reach: 100,
        impressions: 120,
        likes: 10,
        comments: 2,
        shares: 1,
        post: { publishedAt: new Date("2026-09-10") },
      },
      {
        platform: "instagram",
        reach: 50,
        impressions: 60,
        likes: 5,
        comments: 1,
        shares: 0,
        post: { publishedAt: new Date("2026-09-20") },
      },
      {
        platform: "linkedin",
        reach: 75,
        impressions: 90,
        likes: 8,
        comments: 1,
        shares: 2,
        post: { publishedAt: new Date("2026-10-01") },
      },
    ]);

    await expect(
      service.getTimeSeries("workspace-1", new Date("2026-09-01"), new Date("2026-10-31")),
    ).resolves.toEqual([
      { period: "2026-09", instagram: 150 },
      { period: "2026-10", linkedin: 75 },
    ]);
  });

  test("includes reach in the platform breakdown", async () => {
    prismaMock.postMetric.findMany.mockResolvedValue([
      {
        platform: "linkedin",
        likes: 4,
        comments: 1,
        shares: 2,
        impressions: 80,
        reach: 60,
      },
    ]);

    await expect(
      service.getPlatformBreakdown("workspace-1", new Date("2026-09-01"), new Date("2026-09-30")),
    ).resolves.toEqual({
      linkedin: { likes: 4, comments: 1, shares: 2, impressions: 80, reach: 60, posts: 1 },
    });
  });

  test("exports workspace metrics as escaped CSV", async () => {
    prismaMock.postMetric.findMany.mockResolvedValue([
      {
        platform: "linkedin",
        likes: 4,
        comments: 1,
        shares: 2,
        impressions: 80,
        reach: 60,
        clicks: 3,
        saves: 1,
        engagementRate: 5.5,
        post: {
          id: "post-1",
          content: 'Launch, now! "Today"',
          publishedAt: new Date("2026-09-10T00:00:00.000Z"),
        },
      },
    ]);

    await expect(
      service.exportCsv("workspace-1", new Date("2026-09-01"), new Date("2026-09-30")),
    ).resolves.toContain('"post-1","linkedin","2026-09-10T00:00:00.000Z","Launch, now! ""Today"""');
  });
  test("schedules analytics ingestion after a publish succeeds", async () => {
    const add = vi.fn().mockResolvedValue({ id: "job-1" });
    const ingestService = new AnalyticsIngestService({ add } as any);

    await ingestService.scheduleMetricsIngest("post-1", "linkedin", "job-2");

    expect(add).toHaveBeenCalledWith(
      "ingest-metrics",
      { postId: "post-1", postJobId: "job-2", platform: "linkedin" },
      expect.objectContaining({
        jobId: "post-1:linkedin",
        attempts: 3,
        removeOnComplete: true,
      }),
    );
  });});
