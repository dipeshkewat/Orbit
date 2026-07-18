import { Global, Module } from "@nestjs/common";
import { WebhooksService } from "./webhooks.service";

@Global()
@Module({
  providers: [WebhooksService],
  controllers: [],
  exports: [WebhooksService],
})
export class WebhooksModule {}
