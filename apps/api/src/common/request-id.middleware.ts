import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * Shape of a request carrying a correlation ID. Kept as a lightweight
 * interface instead of module augmentation so it works regardless of which
 * express type packages are hoisted.
 */
export interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const request = req as RequestWithId;
    const incoming = req.headers["x-request-id"];
    const requestId =
      typeof incoming === "string" && incoming.length <= 128
        ? incoming
        : randomUUID();

    request.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);
    next();
  }
}
