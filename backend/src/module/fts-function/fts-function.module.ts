import { Module } from '@nestjs/common';
import { FtsFunctionController } from './fts-function.controller';
import { FtsFunctionService } from './fts-function.service';

@Module({
    controllers: [FtsFunctionController],
    providers: [FtsFunctionService],
})
export class FtsFunctionModule { }
