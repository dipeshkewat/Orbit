import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { prisma } from "@orbit/db";

/**
 * Analytics service.
 * Uses Prisma/PostgreSQL with JSONB for metrics storage.
 * Can be swapped to ClickHouse when scale demands it — the interface stays the same.
 */
@Injectable()
export class AnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsService.name);

  async onModuleInit() {
    this.logger.log("Analytics service initialized (PostgreSQL mode)");
  }

  /**
   * Record metrics after a post is published on a platform.
   * Called by the publisher module after successful publishing.
   */
  async recordPostMetrics(data: {
    postId: string;
    platform: string;
    externalId: string;
    metrics?: {
      likes?: number;
      comments?: number;
      shares?: number;
      impressions?: number;
      reach?: number;
      clicks?: number;
      saves?: number;
      engagementRate?: number;
    };
  }) {
    return prisma.postMetric.upsert({
      where: {
        postId_platform: {
          postId: data.postId,
          platform: data.platform,
        },
      },
      create: {
        postId: data.postId,
        platform: data.platform,
        externalId: data.externalId,
        likes: data.metrics?.likes || 0,
        comments: data.metrics?.comments || 0,
        shares: data.metrics?.shares || 0,
        impressions: data.metrics?.impressions || 0,
        reach: data.metrics?.reach || 0,
        clicks: data.metrics?.clicks || 0,
        saves: data.metrics?.saves || 0,
        engagementRate: data.metrics?.engagementRate || 0,
      },
      update: {
        likes: data.metrics?.likes || 0,
        comments: data.metrics?.comments || 0,
        shares: data.metrics?.shares || 0,
        impressions: data.metrics?.impressions || 0,
        reach: data.metrics?.reach || 0,
        clicks: data.metrics?.clicks || 0,
        saves: data.metrics?.saves || 0,
        engagementRate: data.metrics?.engagementRate || 0,
        fetchedAt: new Date(),
      },
    });
  }

  /**
   * Get analytics overview for a workspace within a date range
   */
  async getWorkspaceOverview(
    workspaceId: string,
    startDate: Date,
    endDate: Date,
    platform?: string
  ) {
    const whereClause: any = {
      post: {
        workspaceId,
        publishedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (platform) {
      whereClause.platform = platform;
    }

    const metrics = await prisma.postMetric.findMany({
      where: whereClause,
      include: { post: { select: { publishedAt: true, status: true } } },
    });

    // Aggregate totals
    const totals = metrics.reduce(
      (acc, m) => ({
        likes: acc.likes + m.likes,
        comments: acc.comments + m.comments,
        shares: acc.shares + m.shares,
        impressions: acc.impressions + m.impressions,
        reach: acc.reach + m.reach,
        clicks: acc.clicks + m.clicks,
        saves: acc.saves + m.saves,
        totalPosts: acc.totalPosts + 1,
      }),
      {
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        reach: 0,
        clicks: 0,
        saves: 0,
        totalPosts: 0,
      }
    );

    const avgEngagementRate =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length
        : 0;

    return {
      ...totals,
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  /**
   * Get per-post analytics for a workspace
   */
  async getPostAnalytics(workspaceId: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 20, offset = 0 } = options;

    const posts = await prisma.post.findMany({
      where: {
        workspaceId,
        status: "published",
      },
      include: {
        metrics: true,
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
    });

    return posts.map((post) => ({
      id: post.id,
      content: (post.content || "").slice(0, 100),
      publishedAt: post.publishedAt,
      platforms: post.metrics.map((m) => ({
        platform: m.platform,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        impressions: m.impressions,
        engagementRate: m.engagementRate,
      })),
      totalEngagement: post.metrics.reduce(
        (sum, m) => sum + m.likes + m.comments + m.shares,
        0
      ),
    }));
  }

  /**
   * Get platform-level breakdown for the workspace
   */
  async getPlatformBreakdown(workspaceId: string, startDate: Date, endDate: Date) {
    const metrics = await prisma.postMetric.findMany({
      where: {
        post: {
          workspaceId,
          publishedAt: { gte: startDate, lte: endDate },
        },
      },
    });

    const breakdown: Record<
      string,
      { likes: number; comments: number; shares: number; impressions: number; posts: number }
    > = {};

    for (const m of metrics) {
      if (!breakdown[m.platform]) {
        breakdown[m.platform] = { likes: 0, comments: 0, shares: 0, impressions: 0, posts: 0 };
      }
      breakdown[m.platform].likes += m.likes;
      breakdown[m.platform].comments += m.comments;
      breakdown[m.platform].shares += m.shares;
      breakdown[m.platform].impressions += m.impressions;
      breakdown[m.platform].posts += 1;
    }

    return breakdown;
  }
}
