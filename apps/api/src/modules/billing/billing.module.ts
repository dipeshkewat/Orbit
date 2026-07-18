import { Module } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { StripeWebhookController } from "./stripe-webhook.controller";

@Module({
  providers: [BillingService],
  controllers: [StripeWebhookController],
  exports: [BillingService],
})
export class BillingModule {}
