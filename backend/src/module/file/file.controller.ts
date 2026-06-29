import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { FileService } from './file.service';
import { ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ConfirmUploadDto, DeleteFileResponseDto, FileResponseDto, FilesListResponseDto, GetAllFilesQueryDto, GetAllFilesQuerySchema, InitUploadDto, PresignedUrlResponseDto, UploadDataResponseDto } from './file.schema';
import { MESSAGES } from '@common/constants';
import { IdParamSchema, IdParamsDto } from '@common/schemas/id.schema';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UserPayload } from 'src/common/interfaces/user-payload.interface';
import { User } from 'src/common/decorators/user.decorator';


@UseGuards(JwtAuthGuard)
@Controller({
  path: 'files',
  version: '1',
})
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('upload-url')
  @ApiExtraModels(UploadDataResponseDto)
  @ApiOperation({
    summary: 'Получить URL для загрузки файла',
    description: `Генерирует presigned URL для прямой загрузки файла в MinIO.
        \n\nВажно: 
        \n- Максимальный размер файла: 100MB
        \n- Ссылка действительна 30 минут
        \n- После загрузки файла необходимо вызвать /confirm для сохранения метаданных
        \n- Файл загружается напрямую в MinIO, минуя бэкенд`
  })
  @ApiCreatedResponse({
    description: MESSAGES.RESOURCE_CREATED,
    schema: {
      allOf: [
        { $ref: getSchemaPath(UploadDataResponseDto) }
      ]
    }
  })
  @HttpCode(HttpStatus.CREATED)
  async getUploadUrl(
    @Body() data: InitUploadDto,
  ): Promise<UploadDataResponseDto> {
    const result = await this.fileService.getUploadUrl(data);
    return {
      message: MESSAGES.RESOURCE_CREATED,
      data: result
    };
  }

  @Post('confirm')
  @ApiExtraModels(FileResponseDto)
  @ApiOperation({
    summary: 'Подтвердить загрузку и сохранить метаданные файла',
    description: `Сохраняет информацию о загруженном файле в базу данных.
        \n\nВажно:
        \n- Вызывается ТОЛЬКО после успешной загрузки файла в MinIO
        \n- Проверяет существование файла в хранилище
        \n- Создает запись в БД с isUploadConfirmed = true`
  })
  @ApiCreatedResponse({
    description: MESSAGES.RESOURCE_CREATED,
    schema: {
      allOf: [
        { $ref: getSchemaPath(FileResponseDto) }
      ]
    }
  })
  async confirmUpload(
    @User() user: UserPayload,
    @Body() data: ConfirmUploadDto,
  ): Promise<FileResponseDto> {
    const result = await this.fileService.saveFileMetadata(
      user.id,
      data.objectKey,
      data.ftsFunctionDetailId,
      data.originalName,
      data.fileSize,
      data.mimeType || 'application/octet-stream',
    );
    return {
      message: MESSAGES.RESOURCE_CREATED,
      data: result
    };
  }

  @Post('download-url/:id')
  @ApiExtraModels(PresignedUrlResponseDto)
  @ApiOperation({
    summary: 'Получить URL для скачивания файла',
    description: `Генерирует presigned URL для скачивания файла из MinIO.
        \n\nВажно:
        \n- Проверяет существование файла в БД и MinIO
        \n- Ссылка действительна 24 часа
        \n- Файл скачивается напрямую из MinIO, минуя бэкенд`
  })
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: {
      allOf: [
        { $ref: getSchemaPath(PresignedUrlResponseDto) }
      ]
    }
  })
  async getDownloadUrl(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<PresignedUrlResponseDto> {
    const result = await this.fileService.getDownloadUrl(params.id);
    return {
      message: MESSAGES.RESOURCE_FOUND,
      data: result
    };
  }

  @Get(':id')
  @ApiExtraModels(FileResponseDto)
  @ApiOperation({
    summary: 'Получить информацию о файле',
    description: 'Возвращает метаданные файла по его objectKey'
  })
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: {
      allOf: [
        { $ref: getSchemaPath(FileResponseDto) }
      ]
    }
  })
  async getFileInfo(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<FileResponseDto> {
    const result = await this.fileService.getFileInfo(params.id);
    return {
      message: MESSAGES.RESOURCE_FOUND,
      data: result
    };
  }

  @Get()
  @ApiExtraModels(FilesListResponseDto)
  @ApiOperation({
    summary: 'Получить все файлы функции детализации',
    description: 'Возвращает список всех файлов, принадлежащих указанной детализации функции ФНС'
  })
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: {
      allOf: [
        { $ref: getSchemaPath(FilesListResponseDto) }
      ]
    }
  })
  async getFilesByFtsFunctionDetail(
    @Query(new ZodValidationPipe(GetAllFilesQuerySchema)) query: GetAllFilesQueryDto,
  ): Promise<FilesListResponseDto> {
    const result = await this.fileService.getFilesByFtsFunctionDetail(query.ftsFunctionDetailId);
    return {
      message: MESSAGES.RESOURCE_FOUND,
      data: result
    };
  }

  @Delete(':id')
  @ApiExtraModels(DeleteFileResponseDto)
  @ApiOperation({
    summary: 'Удалить файл',
    description: `Удаляет файл из MinIO и помечает как удаленный в БД.
        \n\nВажно:
        \n- Файл физически удаляется из MinIO
        \n- В БД устанавливается isDeleted = true и deletedAt
        \n- Мягкое удаление позволяет восстановить метаданные при необходимости`
  })
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_DELETED,
    schema: {
      allOf: [
        { $ref: getSchemaPath(DeleteFileResponseDto) }
      ]
    }
  })
  async deleteFile(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<DeleteFileResponseDto> {
    const result = await this.fileService.deleteFile(user.id, params.id);
    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result
    };
  }
}
