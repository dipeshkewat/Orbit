import { Module } from "@nestjs/common";
import { PublisherProcessor } from "./publisher.processor";
import { SocialAccountsModule } from "../social-accounts/social-accounts.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { InstagramPublisher } from "./adapters/instagram.publisher";
import { TwitterPublisher } from "./adapters/twitter.publisher";
import { LinkedInPublisher } from "./adapters/linkedin.publisher";
import { FacebookPublisher } from "./adapters/facebook.publisher";
import { TikTokPublisher } from "./adapters/tiktok.publisher";

@Module({
  imports: [SocialAccountsModule, NotificationsModule, AnalyticsModule],
  providers: [
    PublisherProcessor,
    InstagramPublisher,
    TwitterPublisher,
    LinkedInPublisher,
    FacebookPublisher,
    TikTokPublisher,
  ],
  exports: [
    InstagramPublisher,
    TwitterPublisher,
    LinkedInPublisher,
    FacebookPublisher,
    TikTokPublisher,
  ],
})
export class PublisherModule {}
