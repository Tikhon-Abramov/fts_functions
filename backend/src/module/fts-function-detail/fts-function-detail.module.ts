import { Module } from '@nestjs/common';
import { FtsFunctionDetailController } from './fts-function-detail.controller';
import { FtsFunctionDetailService } from './fts-function-detail.service';

@Module({
  controllers: [FtsFunctionDetailController],
  providers: [FtsFunctionDetailService],
})
export class FtsFunctionDetailModule { }
