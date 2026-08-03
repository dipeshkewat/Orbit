import { Module } from "@nestjs/common";
import { TokenEncryptionService } from "./token-encryption.service";
import { SocialAccountsService } from "./social-accounts.service";
import { MetaOauthService } from "./meta-oauth.service";

@Module({
  providers: [TokenEncryptionService, SocialAccountsService, MetaOauthService],
  controllers: [],
  exports: [TokenEncryptionService, SocialAccountsService, MetaOauthService],
})
export class SocialAccountsModule {}
