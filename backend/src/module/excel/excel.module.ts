import { DynamicModule, Module } from '@nestjs/common';
import { ExcelService } from './excel.service';

@Module({
    providers: [ExcelService],
    exports: [ExcelService],
})
export class ExcelModule {
    static forRoot(useMock: boolean): DynamicModule {
        return {
            module: ExcelModule,
            providers: [
                {
                    provide: ExcelService,
                    useFactory: () => new ExcelService(useMock),
                },
            ],
            exports: [ExcelService],
        };
    }
}
