import { Module } from "@nestjs/common";
import { TokenEncryptionService } from "./token-encryption.service";
import { SocialAccountsService } from "./social-accounts.service";
import { MetaOauthService } from "./meta-oauth.service";
import { LinkedInOauthService } from "./linkedin-oauth.service";
import { OAuthStateService } from "./oauth-state.service";
import { OAuthConnectionService } from "./oauth-connection.service";
import { OAuthCallbackController } from "./oauth-callback.controller";
import { RedisModule } from "../redis/redis.module";

@Module({
  imports: [RedisModule],
  controllers: [OAuthCallbackController],
  providers: [
    TokenEncryptionService,
    SocialAccountsService,
    MetaOauthService,
    LinkedInOauthService,
    OAuthStateService,
    OAuthConnectionService,
  ],
  exports: [
    TokenEncryptionService,
    SocialAccountsService,
    MetaOauthService,
    LinkedInOauthService,
    OAuthStateService,
    OAuthConnectionService,
  ],
})
export class SocialAccountsModule {}
