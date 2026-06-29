import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExcelModule } from '../excel/excel.module';

@Module({
    imports: [ExcelModule.forRoot(true)],
    controllers: [ExportController],
    providers: [ExportService],
})
export class ExportModule { }
