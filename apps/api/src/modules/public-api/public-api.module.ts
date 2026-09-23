import { Module } from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import {
  PostsV1Controller,
  SocialAccountsV1Controller,
  AnalyticsV1Controller,
  WorkspaceV1Controller,
} from "./v1.controllers";
import { ApiRateLimitGuard } from "./api-rate-limit.guard";

// Apply plan-aware rate limiting to every public API route.
for (const controller of [
  PostsV1Controller,
  SocialAccountsV1Controller,
  AnalyticsV1Controller,
  WorkspaceV1Controller,
]) {
  UseGuards(ApiRateLimitGuard)(controller);
}

@Module({
  controllers: [
    PostsV1Controller,
    SocialAccountsV1Controller,
    AnalyticsV1Controller,
    WorkspaceV1Controller,
  ],
  providers: [ApiRateLimitGuard],
})
export class PublicApiModule {}
