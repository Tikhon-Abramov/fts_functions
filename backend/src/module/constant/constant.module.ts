import { Module } from '@nestjs/common';
import { ConstantController } from './constant.controller';
import { ConstantService } from './constant.service';

@Module({
    controllers: [ConstantController],
    providers: [ConstantService],
})
export class ConstantModule { }
