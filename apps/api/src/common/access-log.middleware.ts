import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import type { Request, Response, NextFunction } from "express";
import { RequestWithId } from "./request-id.middleware";

/**
 * Structured access logging for production ingestibility (Datadog,
 * Loki, CloudWatch, etc.). One line per request with correlation ID,
 * latency, and status. Set LOG_FORMAT=json for machine-readable output.
 */
@Injectable()
export class AccessLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const isJsonMode = process.env.LOG_FORMAT === "json";

    res.on("finish", () => {
      const latencyMs = Date.now() - start;
      const requestId = (req as RequestWithId).requestId;
      const record = {
        requestId,
        method: req.method,
        path: req.originalUrl?.split("?")[0],
        status: res.statusCode,
        latencyMs,
      };

      if (isJsonMode) {
        // One-line JSON for log shippers.
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ level: "info", msg: "http_access", ...record }));
      } else if (res.statusCode >= 500) {
        this.logger.error(`${record.method} ${record.path} ${record.status} ${latencyMs}ms [${record.requestId}]`);
      } else if (res.statusCode >= 400) {
        this.logger.warn(`${record.method} ${record.path} ${record.status} ${latencyMs}ms [${record.requestId}]`);
      } else {
        this.logger.log(`${record.method} ${record.path} ${record.status} ${latencyMs}ms [${record.requestId}]`);
      }
    });

    next();
  }
}
