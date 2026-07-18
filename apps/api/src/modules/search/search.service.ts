import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { prisma } from "@socialsphear/db";

/**
 * Search service using in-database full-text search (PostgreSQL).
 * Designed with a Typesense-compatible interface for future migration.
 * When Typesense is added, only the implementation changes — not the API.
 */
@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  async onModuleInit() {
    this.logger.log("Search service initialized (PostgreSQL full-text mode)");
  }

  /**
   * Search posts within a workspace using full-text search
   */
  async searchPosts(
    workspaceId: string,
    query: string,
    options: {
      platforms?: string[];
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const { platforms, status, limit = 20, offset = 0 } = options;

    const where: any = {
      workspaceId,
      content: {
        contains: query,
        mode: "insensitive",
      },
    };

    if (platforms && platforms.length > 0) {
      where.platforms = { hasSome: platforms };
    }
    if (status) {
      where.status = status;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          metrics: {
            select: { platform: true, likes: true, impressions: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      hits: posts.map((post) => ({
        id: post.id,
        content: post.content,
        status: post.status,
        platforms: post.platforms,
        scheduledAt: post.scheduledAt,
        publishedAt: post.publishedAt,
        metrics: post.metrics,
        createdAt: post.createdAt,
        // Highlight matching text
        highlight: this.highlightMatch(post.content || "", query),
      })),
      total,
      query,
      limit,
      offset,
    };
  }

  /**
   * Index a post (no-op in PostgreSQL mode, used for Typesense compatibility)
   */
  async indexPost(postId: string) {
    this.logger.debug(`Index requested for post ${postId} (no-op in PG mode)`);
    return { indexed: true };
  }

  /**
   * Remove a post from the search index
   */
  async removeFromIndex(postId: string) {
    this.logger.debug(`De-index requested for post ${postId} (no-op in PG mode)`);
    return { removed: true };
  }

  /**
   * Highlight matching text with <mark> tags
   */
  private highlightMatch(content: string, query: string): string {
    if (!query) return content.slice(0, 200);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return content.replace(regex, "<mark>$1</mark>").slice(0, 300);
  }
}
