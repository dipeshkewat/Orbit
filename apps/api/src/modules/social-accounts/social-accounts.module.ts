import { Module } from "@nestjs/common";
import { TokenEncryptionService } from "./token-encryption.service";
import { SocialAccountsService } from "./social-accounts.service";

@Module({
  providers: [TokenEncryptionService, SocialAccountsService],
  controllers: [],
  exports: [TokenEncryptionService, SocialAccountsService],
})
export class SocialAccountsModule {}


