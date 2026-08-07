import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { prisma } from "@orbit/db";
import * as crypto from "crypto";

/**
 * API key authentication guard for public REST API.
 * Validates the Bearer token from the Authorization header.
 */
async function authenticateApiKey(authorization: string | undefined) {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new UnauthorizedException("Missing or invalid API key");
  }

  const apiKey = authorization.replace("Bearer ", "");
  const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

  const token = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { workspace: true },
  });

  if (!token) {
    throw new UnauthorizedException("Invalid or expired API key");
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: token.id },
    data: { lastUsedAt: new Date() },
  });

  return token;
}

/**
 * Public REST API v1 — Posts endpoint
 * All endpoints require Bearer token authentication via API key.
 */
@Controller("api/v1/posts")
export class PostsV1Controller {
  private readonly logger = new Logger(PostsV1Controller.name);

  @Get()
  async listPosts(
    @Headers("authorization") auth: string,
    @Query("status") status?: string,
    @Query("platform") platform?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    const token = await authenticateApiKey(auth);
    const take = Math.min(parseInt(limit || "20", 10), 100);
    const skip = parseInt(offset || "0", 10);

    const where: any = { workspaceId: token.workspaceId };
    if (status) where.status = status;
    if (platform) where.platforms = { has: platform };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: { metrics: true },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      pagination: { total, limit: take, offset: skip },
    };
  }

  @Get(":id")
  async getPost(@Headers("authorization") auth: string, @Param("id") id: string) {
    const token = await authenticateApiKey(auth);

    const post = await prisma.post.findUnique({
      where: { id },
      include: { metrics: true, mediaAssets: true },
    });

    if (!post || post.workspaceId !== token.workspaceId) {
      throw new NotFoundException("Post not found");
    }

    return { data: post };
  }

  @Post()
  async createPost(
    @Headers("authorization") auth: string,
    @Body()
    body: {
      content: string;
      platforms: string[];
      scheduledAt?: string;
      status?: string;
    }
  ) {
    const token = await authenticateApiKey(auth);

    if (!body.content || !body.platforms?.length) {
      throw new BadRequestException("content and platforms are required");
    }

    const post = await prisma.post.create({
      data: {
        workspaceId: token.workspaceId,
        content: body.content,
        platforms: body.platforms,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: body.status || "draft",
        createdById: token.workspace.ownerId,
      },
    });

    this.logger.log(`API: Created post ${post.id} for workspace ${token.workspaceId}`);
    return { data: post };
  }

  @Put(":id")
  async updatePost(
    @Headers("authorization") auth: string,
    @Param("id") id: string,
    @Body() body: { content?: string; platforms?: string[]; scheduledAt?: string; status?: string }
  ) {
    const token = await authenticateApiKey(auth);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== token.workspaceId) {
      throw new NotFoundException("Post not found");
    }

    if (existing.status === "published") {
      throw new BadRequestException("Cannot update a published post");
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(body.content && { content: body.content }),
        ...(body.platforms && { platforms: body.platforms }),
        ...(body.scheduledAt && { scheduledAt: new Date(body.scheduledAt) }),
        ...(body.status && { status: body.status }),
      },
    });

    return { data: post };
  }

  @Delete(":id")
  @HttpCode(204)
  async deletePost(@Headers("authorization") auth: string, @Param("id") id: string) {
    const token = await authenticateApiKey(auth);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing || existing.workspaceId !== token.workspaceId) {
      throw new NotFoundException("Post not found");
    }

    await prisma.post.delete({ where: { id } });
  }
}

/**
 * Public REST API v1 — Social Accounts endpoint
 */
@Controller("api/v1/social-accounts")
export class SocialAccountsV1Controller {
  @Get()
  async listAccounts(@Headers("authorization") auth: string) {
    const token = await authenticateApiKey(auth);

    const accounts = await prisma.socialAccount.findMany({
      where: { workspaceId: token.workspaceId },
      select: {
        id: true,
        platform: true,
        username: true,
        displayName: true,
        status: true,
        tokenExpiresAt: true,
        createdAt: true,
      },
    });

    return { data: accounts };
  }
}

/**
 * Public REST API v1 — Analytics endpoint
 */
@Controller("api/v1/analytics")
export class AnalyticsV1Controller {
  @Get("overview")
  async getOverview(
    @Headers("authorization") auth: string,
    @Query("start") start?: string,
    @Query("end") end?: string,
    @Query("platform") platform?: string
  ) {
    const token = await authenticateApiKey(auth);

    const endDate = end ? new Date(end) : new Date();
    const startDate = start ? new Date(start) : new Date(endDate.getTime() - 30 * 86400000);

    const where: any = {
      post: {
        workspaceId: token.workspaceId,
        publishedAt: { gte: startDate, lte: endDate },
      },
    };
    if (platform) where.platform = platform;

    const metrics = await prisma.postMetric.findMany({ where });

    const totals = metrics.reduce(
      (acc, m) => ({
        likes: acc.likes + m.likes,
        comments: acc.comments + m.comments,
        shares: acc.shares + m.shares,
        impressions: acc.impressions + m.impressions,
        reach: acc.reach + m.reach,
        clicks: acc.clicks + m.clicks,
      }),
      { likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0, clicks: 0 }
    );

    return {
      data: {
        ...totals,
        totalPosts: metrics.length,
        period: { start: startDate.toISOString(), end: endDate.toISOString() },
      },
    };
  }
}

/**
 * Public REST API v1 — Workspace info endpoint
 */
@Controller("api/v1/workspace")
export class WorkspaceV1Controller {
  @Get()
  async getWorkspace(@Headers("authorization") auth: string) {
    const token = await authenticateApiKey(auth);

    const workspace = await prisma.workspace.findUnique({
      where: { id: token.workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        createdAt: true,
        _count: {
          select: { posts: true, socialAccounts: true, teamMembers: true },
        },
      },
    });

    return { data: workspace };
  }
}
