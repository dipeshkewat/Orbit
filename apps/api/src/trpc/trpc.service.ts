import { Injectable } from "@nestjs/common";
import { initTRPC, TRPCError } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { prisma } from "@socialsphear/db";

// Define the context type
export interface TrpcContext {
  userId?: string;
  orgId?: string;
  prisma: typeof prisma;
}

@Injectable()
export class TrpcService {
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
    let userId: string | undefined;
    let orgId: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      // In production, decode Clerk JWT token here.
      // For now, parse placeholder or mocked token.
      if (token === "placeholder" || token.startsWith("pk_") || token.startsWith("sk_")) {
        userId = "placeholder-user";
        orgId = "placeholder-org";
      } else {
        // If JWT token is present, we can decode it here
        try {
          // Placeholder decoding or mock logic
          userId = "user_mocked_id";
          orgId = "org_mocked_id";
        } catch (e) {
          // Token invalid, leave userId/orgId undefined
        }
      }
    }

    return {
      userId,
      orgId,
      prisma,
    };
  }
}
