import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  postJob: {
    findUnique: vi.fn(),
  },
}));

vi.mock("@orbit/db", () => ({
  prisma: prismaMock,
}));

import { AnalyticsIngestProcessor } from "./analytics-ingest.processor";
import { InstagramMetricsFetcher } from "./adapters/instagram-metrics.fetcher";
import { TwitterMetricsFetcher } from "./adapters/twitter-metrics.fetcher";
import { LinkedInMetricsFetcher } from "./adapters/linkedin-metrics.fetcher";
import { FacebookMetricsFetcher } from "./adapters/facebook-metrics.fetcher";
import { TikTokMetricsFetcher } from "./adapters/tiktok-metrics.fetcher";

const socialAccountsServiceMock = {
  getDecryptedAccessToken: vi.fn(),
};

const analyticsServiceMock = {
  recordPostMetrics: vi.fn(),
};

const fetchers = {
  instagram: new InstagramMetricsFetcher(),
  twitter: new TwitterMetricsFetcher(),
  linkedin: new LinkedInMetricsFetcher(),
  facebook: new FacebookMetricsFetcher(),
  tiktok: new TikTokMetricsFetcher(),
};

const processor = new AnalyticsIngestProcessor(
  socialAccountsServiceMock as any,
  analyticsServiceMock as any,
  fetchers.instagram,
  fetchers.twitter,
  fetchers.linkedin,
  fetchers.facebook,
  fetchers.tiktok,
);

const buildJob = (data: { postId: string; postJobId: string; platform: string }) =>
  ({ data }) as any;

const publishedPostJob = (overrides: Record<string, unknown> = {}) => ({
  id: "pj-1",
  postId: "post-1",
  platform: "linkedin",
  status: "published",
  publishedAt: new Date("2026-09-10T10:00:00Z"),
  platformPostId: "urn:li:share:123",
  socialAccount: {
    id: "acc-1",
    workspaceId: "ws-1",
    platform: "linkedin",
    username: "acme",
    platformUserId: "urn:li:person:abc",
  },
  ...overrides,
});

describe("AnalyticsIngestProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(processor["logger"], "warn").mockImplementation(() => {});
    vi.spyOn(processor["logger"], "log").mockImplementation(() => {});
    vi.spyOn(processor["logger"], "error").mockImplementation(() => {});
  });

  test("fetches metrics and upserts PostMetric rows for a published job", async () => {
    prismaMock.postJob.findUnique.mockResolvedValue(publishedPostJob());
    socialAccountsServiceMock.getDecryptedAccessToken.mockResolvedValue("token-123");
    vi.spyOn(fetchers.linkedin, "fetchMetrics").mockResolvedValue({
      success: true,
      metrics: {
        likes: 12,
        comments: 3,
        shares: 2,
        saves: 0,
        impressions: 400,
        reach: 0,
        clicks: 7,
        engagementRate: 4.25,
      },
    });

    await expect(
      processor.process(buildJob({ postId: "post-1", postJobId: "pj-1", platform: "linkedin" })),
    ).resolves.toBeUndefined();

    expect(socialAccountsServiceMock.getDecryptedAccessToken).toHaveBeenCalledWith(
      "ws-1",
      "acc-1",
    );
    expect(analyticsServiceMock.recordPostMetrics).toHaveBeenCalledWith({
      postId: "post-1",
      platform: "linkedin",
      externalId: "urn:li:share:123",
      metrics: expect.objectContaining({ likes: 12, engagementRate: 4.25 }),
    });
  });

  test("skips ingest when the PostJob is missing (deleted post)", async () => {
    prismaMock.postJob.findUnique.mockResolvedValue(null);

    await expect(
      processor.process(buildJob({ postId: "post-1", postJobId: "pj-1", platform: "linkedin" })),
    ).resolves.toBeUndefined();

    expect(socialAccountsServiceMock.getDecryptedAccessToken).not.toHaveBeenCalled();
    expect(analyticsServiceMock.recordPostMetrics).not.toHaveBeenCalled();
  });

  test("skips ingest when the PostJob is not published", async () => {
    prismaMock.postJob.findUnique.mockResolvedValue(
      publishedPostJob({ status: "failed", publishedAt: null }),
    );

    await expect(
      processor.process(buildJob({ postId: "post-1", postJobId: "pj-1", platform: "linkedin" })),
    ).resolves.toBeUndefined();

    expect(analyticsServiceMock.recordPostMetrics).not.toHaveBeenCalled();
  });

  test("skips ingest for unsupported platforms", async () => {
    prismaMock.postJob.findUnique.mockResolvedValue(
      publishedPostJob({ platform: "pinterest" }),
    );

    await expect(
      processor.process(buildJob({ postId: "post-1", postJobId: "pj-1", platform: "pinterest" })),
    ).resolves.toBeUndefined();

    expect(socialAccountsServiceMock.getDecryptedAccessToken).not.toHaveBeenCalled();
    expect(analyticsServiceMock.recordPostMetrics).not.toHaveBeenCalled();
  });

  test("rethrows retryable provider failures so BullMQ retries", async () => {
    prismaMock.postJob.findUnique.mockResolvedValue(publishedPostJob());
    socialAccountsServiceMock.getDecryptedAccessToken.mockResolvedValue("token-123");
    vi.spyOn(fetchers.linkedin, "fetchMetrics").mockResolvedValue({
      success: false,
      errorMessage: "rate limit exceeded",
      retryable: true,
    });

    await expect(
      processor.process(buildJob({ postId: "post-1", postJobId: "pj-1", platform: "linkedin" })),
    ).rejects.toThrow(/rate limit exceeded/);

    expect(analyticsServiceMock.recordPostMetrics).not.toHaveBeenCalled();
  });

  test("swallows non-retryable provider failures without recording metrics", async () => {
    prismaMock.postJob.findUnique.mockResolvedValue(publishedPostJob());
    socialAccountsServiceMock.getDecryptedAccessToken.mockResolvedValue("token-123");
    vi.spyOn(fetchers.linkedin, "fetchMetrics").mockResolvedValue({
      success: false,
      errorMessage: "LinkedIn metric fetch skipped: PostJob has no platformPostId.",
      retryable: false,
    });

    await expect(
      processor.process(buildJob({ postId: "post-1", postJobId: "pj-1", platform: "linkedin" })),
    ).resolves.toBeUndefined();

    expect(analyticsServiceMock.recordPostMetrics).not.toHaveBeenCalled();
  });

  test("treats token resolution failure as non-retryable", async () => {
    prismaMock.postJob.findUnique.mockResolvedValue(publishedPostJob());
    socialAccountsServiceMock.getDecryptedAccessToken.mockRejectedValue(
      new Error("Social account not found"),
    );

    await expect(
      processor.process(buildJob({ postId: "post-1", postJobId: "pj-1", platform: "linkedin" })),
    ).resolves.toBeUndefined();

    expect(analyticsServiceMock.recordPostMetrics).not.toHaveBeenCalled();
  });
});

describe("PlatformMetricFetchers (mocked provider APIs)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("instagram fetcher maps Graph API insights to normalized metrics", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [
            { name: "likes", values: [{ value: 45 }] },
            { name: "comments", values: [{ value: 6 }] },
            { name: "shares", values: [{ value: 2 }] },
            { name: "saved", values: [{ value: 9 }] },
            { name: "reach", values: [{ value: 1200 }] },
            { name: "impressions", values: [{ value: 1500 }] },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob({ platform: "instagram", platformPostId: "ig-media-1" });
    const account = postJob.socialAccount;
    account.platform = "instagram";

    const result = await fetchers.instagram.fetchMetrics(
      postJob as any,
      account as any,
      "token",
    );

    expect(result.success).toBe(true);
    expect(result.metrics).toMatchObject({
      likes: 45,
      comments: 6,
      shares: 2,
      saves: 9,
      reach: 1200,
      impressions: 1500,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("https://graph.facebook.com/v21.0/ig-media-1/insights"),
    );
  });

  test("instagram fetcher reports missing platformPostId as non-retryable", async () => {
    const postJob = publishedPostJob({ platform: "instagram", platformPostId: null });

    const result = await fetchers.instagram.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(false);
  });

  test("twitter fetcher maps organic metrics and sums retweets plus quotes", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: {
            organic_metrics: {
              like_count: 30,
              reply_count: 4,
              retweet_count: 5,
              quote_count: 3,
              impression_count: 900,
              url_link_clicks: 11,
            },
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob({ platform: "twitter", platformPostId: "tweet-9" });
    const result = await fetchers.twitter.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(true);
    expect(result.metrics).toMatchObject({
      likes: 30,
      comments: 4,
      shares: 8,
      impressions: 900,
      clicks: 11,
    });
  });

  test("twitter fetcher marks deleted tweets as non-retryable", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob({ platform: "twitter", platformPostId: "tweet-gone" });
    const result = await fetchers.twitter.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(false);
  });

  test("linkedin fetcher maps total share statistics", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          totalShareStatistics: {
            likeCount: 21,
            commentCount: 5,
            shareCount: 3,
            impressionCount: 2100,
            clickCount: 18,
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob();
    const result = await fetchers.linkedin.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(true);
    expect(result.metrics).toMatchObject({
      likes: 21,
      comments: 5,
      shares: 3,
      impressions: 2100,
      clicks: 18,
    });
  });

  test("linkedin fetcher treats rate limiting as retryable", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob();
    const result = await fetchers.linkedin.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(true);
  });

  test("facebook fetcher maps page post insights", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          data: [
            { name: "post_impressions", values: [{ value: 2400 }] },
            { name: "post_impressions_unique", values: [{ value: 1800 }] },
            { name: "post_clicks", values: [{ value: 60 }] },
          ],
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob({ platform: "facebook", platformPostId: "fb-post-1" });
    const result = await fetchers.facebook.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(true);
    expect(result.metrics).toMatchObject({
      impressions: 2400,
      reach: 1800,
      clicks: 60,
    });
  });

  test("tiktok fetcher maps video query metrics with views as reach", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          error: { code: "ok" },
          data: {
            videos: [
              {
                like_count: 88,
                comment_count: 12,
                share_count: 9,
                view_count: 5400,
              },
            ],
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob({ platform: "tiktok", platformPostId: "tt-video-1" });
    const result = await fetchers.tiktok.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(true);
    expect(result.metrics).toMatchObject({
      likes: 88,
      comments: 12,
      shares: 9,
      impressions: 5400,
      reach: 5400,
    });
  });

  test("tiktok fetcher reports missing videos as non-retryable", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          error: { code: "ok" },
          data: { videos: [] },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const postJob = publishedPostJob({ platform: "tiktok", platformPostId: "tt-missing" });
    const result = await fetchers.tiktok.fetchMetrics(
      postJob as any,
      postJob.socialAccount as any,
      "token",
    );

    expect(result.success).toBe(false);
    expect(result.retryable).toBe(false);
  });
});
