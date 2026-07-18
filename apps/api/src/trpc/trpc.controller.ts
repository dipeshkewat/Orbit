import { Controller, All, Req, Res } from "@nestjs/common";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { TrpcRouter } from "./trpc.router";
import { TrpcService } from "./trpc.service";
import { Request, Response } from "express";

@Controller("trpc")
export class TrpcController {
  constructor(
    private readonly trpcRouter: TrpcRouter,
    private readonly trpcService: TrpcService
  ) {}

  /**
   * Catch-all route to forward all /trpc/* requests to tRPC Express adapter
   */
  @All("*")
  async handler(@Req() req: Request, @Res() res: Response) {
    const trpcHandler = createExpressMiddleware({
      router: this.trpcRouter.appRouter,
      createContext: (opts) => this.trpcService.createContext(opts),
    });
    return trpcHandler(req, res, () => {});
  }
}
