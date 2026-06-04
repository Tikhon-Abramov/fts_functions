import { Module } from '@nestjs/common';

import { FtsFunctionController } from './fts-function.controller';
import { FtsFunctionService } from './fts-function.service';
import { FtsFunctionCounterService } from './fts-function-counter.service';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [ExcelModule.forRoot(true)],
  controllers: [FtsFunctionController],
  providers: [FtsFunctionService, FtsFunctionCounterService],
})
export class FtsFunctionModule {}
