import { Module } from "@nestjs/common";
import { WorkspaceService } from "./workspace.service";

@Module({
  providers: [WorkspaceService],
  controllers: [],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

