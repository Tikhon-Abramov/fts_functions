import { Controller, Get, StreamableFile } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProduces } from "@nestjs/swagger";
import { ExportService } from "./export.service";



const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller({
  path: 'fts-functions',
  version: '1',
})
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get('download')
  @ApiOperation({
    summary: 'Скачивание выгрузки по функциям',
    description:
      'Выгружает все функции с их детализациями в формате XLSX-файла.',
  })
  @ApiProduces(XLSX_MIME)
  @ApiOkResponse({
    description: 'Файл успешно выгружен',
    content: {
      [XLSX_MIME]: {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async getDownload(): Promise<StreamableFile> {
    const buffer = await this.service.getDownload();

    return new StreamableFile(buffer, {
      type: XLSX_MIME,
      disposition: 'attachment; filename="fts-functions.xlsx"',
    });
  }
}