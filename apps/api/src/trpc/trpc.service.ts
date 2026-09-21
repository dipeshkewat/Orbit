import { Injectable, Logger } from "@nestjs/common";
import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyToken } from "@clerk/backend";
import { prisma } from "@orbit/db";
import { TeamRole } from "@orbit/types";

// Define the context type
export interface TrpcContext {
  userId?: string;
  orgId?: string;
  prisma: typeof prisma;
}

const MUTATING_ROLES: TeamRole[] = ["owner", "admin", "editor"];

@Injectable()
export class TrpcService {
  private readonly logger = new Logger(TrpcService.name);

  // Initialize tRPC
  private t = initTRPC.context<TrpcContext>().create();

  public router = this.t.router;
  public mergeRouters = this.t.mergeRouters;
  public publicProcedure = this.t.procedure;

  // Protected procedure to enforce authentication
  public protectedProcedure = this.t.procedure.use(({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return next({
      ctx: {
        ...ctx,
        userId: ctx.userId,
      },
    });
  });

  /**
   * Helper to create tRPC context from Express request options.
   * Extracts authorization header and potential clerk session.
   */
  public async createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
    const authHeader = opts.req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return { prisma };
    }

    const token = authHeader.slice(7).trim();
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!token || !secretKey) {
      return { prisma };
    }

    try {
      const session = await verifyToken(token, { secretKey });
      return {
        userId: session.sub,
        orgId: typeof session.org_id === "string" ? session.org_id : undefined,
        prisma,
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Clerk token verification failed: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      return { prisma };
    }
  }

  public async authorizeWorkspace(
    ctx: TrpcContext,
    workspaceId: string,
    roles: TeamRole[] = [],
  ) {
    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      select: { id: true },
    });
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User account is not provisioned" });
    }

    const member = await ctx.prisma.teamMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        inviteStatus: "accepted",
        ...(roles.length > 0 ? { role: { in: roles } } : {}),
      },
      select: { id: true, role: true },
    });
    if (!member) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Workspace resource not found" });
    }
    if (roles.length > 0 && !roles.includes(member.role as TeamRole)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Workspace resource not found" });
    }

    return { userId: user.id, role: member.role };
  }

  public async authorizeWorkspaceMutation(ctx: TrpcContext, workspaceId: string) {
    return this.authorizeWorkspace(ctx, workspaceId, MUTATING_ROLES);
  }

}

