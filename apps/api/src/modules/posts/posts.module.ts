import { Module } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { SchedulerModule } from "../scheduler/scheduler.module";

@Module({
  imports: [SchedulerModule],
  providers: [PostsService],
  controllers: [],
  exports: [PostsService],
})
export class PostsModule {}


