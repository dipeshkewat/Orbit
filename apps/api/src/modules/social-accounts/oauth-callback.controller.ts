import { BadRequestException, Controller, Get, Param, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { PlatformSchema } from "@orbit/types";
import { OAuthConnectionService } from "./oauth-connection.service";

type OAuthCallbackQuery = {
  code?: string;
  state?: string;
  error?: string;
};

@Controller("oauth")
export class OAuthCallbackController {
  constructor(private readonly oauthConnection: OAuthConnectionService) {}

  @Get("callback/:platform")
  async callback(
    @Param("platform") platformParam: string,
    @Query() query: OAuthCallbackQuery,
    @Res() response: Response,
  ): Promise<void> {
    const platformResult = PlatformSchema.safeParse(platformParam);
    if (!platformResult.success || !query.code || !query.state) {
      throw new BadRequestException(query.error ?? "Invalid OAuth callback");
    }

    await this.oauthConnection.complete(
      platformResult.data,
      query.code,
      undefined,
      query.state,
    );

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    const redirect = new URL("/settings/accounts", frontendUrl);
    redirect.searchParams.set("connected", platformResult.data);
    response.redirect(redirect.toString());
  }
}