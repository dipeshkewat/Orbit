import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiDifferentiationService } from "./ai-differentiation.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [BillingModule],
  providers: [AiService, AiDifferentiationService],
  exports: [AiService, AiDifferentiationService],
})
export class AiModule {}
