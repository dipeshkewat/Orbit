import { Module } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { EntitlementService } from "./entitlement.service";
import { StripeWebhookController } from "./stripe-webhook.controller";

@Module({
  providers: [BillingService, EntitlementService],
  controllers: [StripeWebhookController],
  exports: [BillingService, EntitlementService],
})
export class BillingModule {}
