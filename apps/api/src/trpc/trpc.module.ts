import { Module } from "@nestjs/common";
import { TrpcService } from "./trpc.service";
import { TrpcRouter } from "./trpc.router";
import { TrpcController } from "./trpc.controller";
import { SocialAccountsModule } from "../modules/social-accounts/social-accounts.module";
import { PostsModule } from "../modules/posts/posts.module";

@Module({
  imports: [SocialAccountsModule, PostsModule],
  controllers: [TrpcController],
  providers: [TrpcService, TrpcRouter],
  exports: [TrpcService, TrpcRouter],
})
export class TrpcModule {}
