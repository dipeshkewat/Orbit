import { Module } from "@nestjs/common";
import { TokenEncryptionService } from "./token-encryption.service";
import { SocialAccountsService } from "./social-accounts.service";
import { MetaOauthService } from "./meta-oauth.service";
import { LinkedInOauthService } from "./linkedin-oauth.service";

@Module({
  providers: [
    TokenEncryptionService,
    SocialAccountsService,
    MetaOauthService,
    LinkedInOauthService,
  ],
  exports: [
    TokenEncryptionService,
    SocialAccountsService,
    MetaOauthService,
    LinkedInOauthService,
  ],
})
export class SocialAccountsModule {}
