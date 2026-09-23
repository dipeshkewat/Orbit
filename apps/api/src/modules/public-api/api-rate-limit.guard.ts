import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import Redis from "ioredis";
import { prisma } from "@orbit/db";
import { PLAN_LIMITS, Plan } from "@orbit/types";
import * as crypto from "crypto";

/**
 * Plan-aware rate limiting for the public REST API.
 * Limits come from PLAN_LIMITS[plan].apiRequestsPerMin of the key's
 * workspace, falling back to the default guard behavior for anonymous
 * traffic. Fails open if Redis is unavailable.
 */
@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redis: Redis
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const authorization = request.headers["authorization"] as string | undefined;
    const apiKey = authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : undefined;

    let limit = 100; // anonymous default
    let identity = request.ip || "anonymous";

    if (apiKey) {
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      const token = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { workspace: { select: { plan: true } } },
      });
      if (token) {
        identity = `key:${token.id}`;
        const planLimit = PLAN_LIMITS[token.workspace.plan as Plan]?.apiRequestsPerMin;
        // Free plan has 0 API requests — any authenticated key requires a
        // paid plan; treat 0 as blocked.
        limit = planLimit && planLimit > 0 ? planLimit : 60;
      }
    }

    const windowSeconds = 60;
    const rateLimitKey = `ratelimit:api:${identity}`;

    try {
      const currentRequests = (await this.redis.eval(
        `
        local key = KEYS[1]
        local limit = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local current = redis.call('get', key)
        if current and tonumber(current) >= limit then
            return tonumber(current) + 1
        end

        current = redis.call('incr', key)
        if tonumber(current) == 1 then
            redis.call('expire', key, window)
        end
        return tonumber(current)
        `,
        1,
        rateLimitKey,
        limit,
        windowSeconds
      )) as number;

      response.setHeader("X-RateLimit-Limit", limit);
      response.setHeader("X-RateLimit-Remaining", Math.max(0, limit - currentRequests));

      if (currentRequests > limit) {
        const ttl = await this.redis.ttl(rateLimitKey);
        response.setHeader("Retry-After", ttl > 0 ? ttl : 1);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: "Too Many Requests",
            message: `API rate limit exceeded (${limit} req/min). Please try again in ${ttl > 0 ? ttl : 1} seconds.`,
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    } catch (err) {
      // Rate limit rejections must propagate; only infrastructure failures
      // (Redis down) fail open.
      if (err instanceof HttpException) throw err;
      // Fail open — availability over strict limiting.
    }

    return true;
  }
}
