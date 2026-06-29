import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { User } from '@common/decorators/user.decorator'
import { UserPayload } from '@common/interfaces/user-payload.interface';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { IdParamSchema, IdParamsDto } from '@common/schemas/id.schema';
import { ErrorResponseDto } from '@common/schemas/error-response.schema';
import { MESSAGES } from '@common/constants';
import { FtsFunctionService } from './fts-function.service';
import {
  FtsFunctionBaseResponseDto,
  FtsFunctionQueryDto,
  CreateFtsFunctionSchema,
  CreateFtsFunctionDto,
  UpdateFtsFunctionSchema,
  UpdateFtsFunctionDto,
  FtsFunctionItemsResponseDto,
  FtsFunctionQuerySchema,
} from './fts-function.schema';


@UseGuards(JwtAuthGuard)
@Controller({
  path: 'fts-functions',
  version: '1',
})
export class FtsFunctionController {
  constructor(private readonly ftsFunction: FtsFunctionService) { }


  /// Получение всего списка функций
  @Get()
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FtsFunctionItemsResponseDto) },
  })
  @ApiExtraModels(FtsFunctionItemsResponseDto)
  async getAllFtsFunctions(
    @Query(new ZodValidationPipe(FtsFunctionQuerySchema)) query: FtsFunctionQueryDto,
  ): Promise<FtsFunctionItemsResponseDto> {
    const data = await this.ftsFunction.getAllFtsFunctions(query);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    }
  }


  /// Получение полной информации по функции по ID
  @Get('info/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FtsFunctionBaseResponseDto) },
  })
  @ApiExtraModels(FtsFunctionBaseResponseDto)
  async getFtsFunctionById(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<FtsFunctionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const data = await this.ftsFunction.getFtsFunctionById(id);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    }
  }


  /// Создание функции
  @Post()
  @ApiCreatedResponse({
    description: MESSAGES.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FtsFunctionBaseResponseDto) },
  })
  @ApiBadRequestResponse({
    description: 'Функция с таким наименованием уже существует',
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(FtsFunctionBaseResponseDto)
  async create(
    @User() user: UserPayload,
    @Body(new ZodValidationPipe(CreateFtsFunctionSchema)) data: CreateFtsFunctionDto,
  ): Promise<FtsFunctionBaseResponseDto> {
    const result = await this.ftsFunction.create(user.id, data);

    return {
      message: MESSAGES.RESOURCE_CREATED,
      data: result,
    };
  }


  /// Обновление функции
  @Patch(':id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FtsFunctionBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiBadRequestResponse({
    description: 'Функция с таким наименованием уже существует',
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(FtsFunctionBaseResponseDto)
  async update(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @Body(new ZodValidationPipe(UpdateFtsFunctionSchema)) data: UpdateFtsFunctionDto,
  ): Promise<FtsFunctionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.ftsFunction.update(user.id, id, data);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }


  /// Удаление функции
  @Patch('delete/:id')
  @ApiExtraModels(FtsFunctionBaseResponseDto)
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FtsFunctionBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  async delete(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<FtsFunctionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.ftsFunction.delete(user.id, id);

    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result,
    };
  }
}
