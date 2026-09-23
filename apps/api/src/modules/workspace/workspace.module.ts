import { Module } from "@nestjs/common";
import { WorkspaceService } from "./workspace.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [BillingModule],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
