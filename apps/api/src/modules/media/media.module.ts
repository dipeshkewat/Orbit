import { Module } from "@nestjs/common";
import { MediaService } from "./media.service";

@Module({
  providers: [MediaService],
  controllers: [],
  exports: [MediaService],
})
export class MediaModule {}

