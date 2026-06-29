import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { User } from '@common/decorators/user.decorator';
import { UserPayload } from '@common/interfaces/user-payload.interface';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { IdParamSchema, IdParamsDto } from '@common/schemas/id.schema';
import { ErrorResponseDto } from '@common/schemas/error-response.schema';
import { MESSAGES } from '@common/constants';
import { FtsFunctionDetailService } from './fts-function-detail.service';
import {
  CreateFtsFunctionDetailSchema,
  CreateFtsFunctionDetailDto,
  UpdateFtsFunctionDetailSchema,
  UpdateFtsFunctionDetailDto,
  FtsFunctionDetailItemsResponseDto,
  FtsFunctionDetailBaseResponseDto,
  FtsFunctionDetailQuerySchema,
  FtsFunctionDetailQueryDto,
  ReorderFtsFunctionDetailSchema,
  ReorderFtsFunctionDetailDto,
  FtsFunctionDetailsRelationResponseDto,
  FtsFunctionDetailsRelationQuerySchema,
  FtsFunctionDetailsRelationQueryDto,
  CreateFtsFunctionDetailsRelationSchema,
  CreateFtsFunctionDetailsRelationDto,
  FtsFunctionDetailsRelationDeleteQuerySchema,
  FtsFunctionDetailsRelationDeleteQueryDto,
} from './fts-function-detail.schema';



@UseGuards(JwtAuthGuard)
@Controller({
  path: 'fts-function-details',
  version: '1',
})
export class FtsFunctionDetailController {
  constructor(private readonly ftsFunctionDetail: FtsFunctionDetailService) {}


  /// Получение списка детализаций
  @Get(':ftsFunctionId')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FtsFunctionDetailItemsResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailItemsResponseDto)
  async getAllFtsFunctionDetails(
    @Param(new ZodValidationPipe(FtsFunctionDetailQuerySchema)) params: FtsFunctionDetailQueryDto,
  ): Promise<FtsFunctionDetailItemsResponseDto> {
    const data = await this.ftsFunctionDetail.getAllFtsFunctionDetails(params.ftsFunctionId);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    };
  }


  /// Получение детализации по ID
  @Get('info/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FtsFunctionDetailBaseResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailBaseResponseDto)
  async getFtsFunctionDetailById(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<FtsFunctionDetailBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const data = await this.ftsFunctionDetail.getFtsFunctionDetailById(id);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    }
  }


  /// Создание детализации
  @Post()
  @ApiCreatedResponse({
    description: MESSAGES.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailBaseResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailBaseResponseDto)
  async create(
    @User() user: UserPayload,
    @Body(new ZodValidationPipe(CreateFtsFunctionDetailSchema)) data: CreateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailBaseResponseDto> {
    const result = await this.ftsFunctionDetail.create(user.id, data);

    return {
      message: MESSAGES.RESOURCE_CREATED,
      data: result,
    };
  }


  /// Обновление детализации
  @Patch(':id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailBaseResponseDto)
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @User() user: UserPayload,
    @Body(new ZodValidationPipe(UpdateFtsFunctionDetailSchema)) data: UpdateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.ftsFunctionDetail.update(user.id, id, data);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }


  /// Логическое удаление детализации
  @Patch('delete/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailBaseResponseDto)
  async delete(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @User() user: UserPayload,
  ): Promise<FtsFunctionDetailBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.ftsFunctionDetail.delete(user.id, id);

    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result,
    };
  }


  /// Изменение порядка расположения детализаций
  @Patch('reorder/:ftsFunctionId')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailItemsResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailItemsResponseDto)
  async reorderFtsFunctionDetails(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(FtsFunctionDetailQuerySchema)) params: FtsFunctionDetailQueryDto,
    @Body(new ZodValidationPipe(ReorderFtsFunctionDetailSchema)) data: ReorderFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailItemsResponseDto> {
    const result = await this.ftsFunctionDetail.reorderFtsFunctionDetails(user.id, params.ftsFunctionId, data.orderedIds);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }


  /// Получение связанных и не связанных детализаций с выбранной
  @Get('relations')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FtsFunctionDetailsRelationResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailsRelationResponseDto)
  async getRelations(
    @Query(new ZodValidationPipe(FtsFunctionDetailsRelationQuerySchema)) params: FtsFunctionDetailsRelationQueryDto,
  ): Promise<FtsFunctionDetailsRelationResponseDto> {
    const result = await this.ftsFunctionDetail.getRelations(params);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data: result,
    };
  }


  /// Создание связи между детализациями функций
  @Post('relations')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: MESSAGES.RESOURCE_CREATED })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(ErrorResponseDto)
  createRelation(
    @User() user: UserPayload,
    @Body(new ZodValidationPipe(CreateFtsFunctionDetailsRelationSchema)) data: CreateFtsFunctionDetailsRelationDto,
  ): Promise<void> {
    return this.ftsFunctionDetail.createRelation(user.id, data);
  }


  /// Удаление связи между детализациями функций
  @Delete('relations')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: MESSAGES.RESOURCE_DELETED })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(ErrorResponseDto)
  deleteRelation(
    @User() user: UserPayload,
    @Query(new ZodValidationPipe(FtsFunctionDetailsRelationDeleteQuerySchema)) params: FtsFunctionDetailsRelationDeleteQueryDto,
  ): Promise<void> {
    return this.ftsFunctionDetail.deleteRelation(user.id, params);
  }




}
