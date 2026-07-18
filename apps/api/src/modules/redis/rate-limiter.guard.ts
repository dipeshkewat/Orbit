import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RateLimiterGuard implements CanActivate {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redis: Redis
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Determine the client identity: prioritize API key, fallback to IP address
    const apiKey = request.headers["authorization"] || request.headers["x-api-key"];
    const ip = request.ip || request.connection.remoteAddress || "anonymous";
    const rateLimitKey = apiKey ? `rate:${apiKey}` : `rate:${ip}`;
    
    // Sliding window of 60 seconds
    const limit = apiKey ? 500 : 100; // 500 req/min for authenticated keys, 100 for anonymous IP
    const windowSeconds = 60;

    const currentRequests = await this.redis.eval(
      `
      local key = KEYS[1]
      local limit = tonumber(ARGV[1])
      local window = tonumber(ARGV[2])
      local current = redis.call('get', key)
      if current and tonumber(current) >= limit then
          return tonumber(current)
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
    ) as number;

    // Set standard rate limiting response headers
    response.setHeader("X-RateLimit-Limit", limit);
    response.setHeader("X-RateLimit-Remaining", Math.max(0, limit - currentRequests));

    if (currentRequests > limit) {
      const ttl = await this.redis.ttl(rateLimitKey);
      response.setHeader("Retry-After", ttl > 0 ? ttl : 1);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: "Too Many Requests",
          message: `API rate limit exceeded. Please try again in ${ttl > 0 ? ttl : 1} seconds.`,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}
