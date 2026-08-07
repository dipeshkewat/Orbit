import { Module } from "@nestjs/common";
import {
  PostsV1Controller,
  SocialAccountsV1Controller,
  AnalyticsV1Controller,
  WorkspaceV1Controller,
} from "./v1.controllers";

@Module({
  controllers: [
    PostsV1Controller,
    SocialAccountsV1Controller,
    AnalyticsV1Controller,
    WorkspaceV1Controller,
  ],
})
export class PublicApiModule {}
