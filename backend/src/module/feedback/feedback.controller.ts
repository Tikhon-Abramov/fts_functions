import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { User } from '@common/decorators/user.decorator';
import { UserPayload } from '@common/interfaces/user-payload.interface';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { IdParamSchema, IdParamsDto } from '@common/schemas/id.schema';
import { ErrorResponseDto } from '@common/schemas/error-response.schema';
import { MESSAGES } from '@common/constants';
import { FeedbackService } from './feedback.service';
import {
  FeedbackQuerySchema,
  FeedbackQueryDto,
  CreateFeedbackSchema,
  CreateFeedbackDto,
  UpdateFeedbackSchema,
  UpdateFeedbackDto,
  AcceptFeedbackSchema,
  AcceptFeedbackDto,
  FeedbackItemsResponseDto,
  FeedbackBaseResponseDto,
  ReorderFeedbacksSchema,
  ReorderFeedbacksDto,
} from './feedback.schema';


@UseGuards(JwtAuthGuard)
@Controller({
  path: 'feedbacks',
  version: '1',
})
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) { }


  /// Получение всего списка обратной связи для выбранной детализации
  @Get(':ftsFunctionDetailId')
  @ApiExtraModels(FeedbackItemsResponseDto)
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FeedbackItemsResponseDto) },
  })
  async getAllFeedbacks(
    @Param(new ZodValidationPipe(FeedbackQuerySchema)) params: FeedbackQueryDto,
  ): Promise<FeedbackItemsResponseDto> {
    const data = await this.feedback.getAllFeedbacks(params.ftsFunctionDetailId);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    };
  }


  /// Получение обратной связи по ID
  @Get('info/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FeedbackBaseResponseDto) },
  })
  @ApiExtraModels(FeedbackBaseResponseDto)
  async getFeedbackById(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<FeedbackBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const data = await this.feedback.getFeedbackById(id);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    }
  }


  /// Создание обратной связи
  @Post()
  @ApiExtraModels(FeedbackBaseResponseDto)
  @ApiCreatedResponse({
    description: MESSAGES.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FeedbackBaseResponseDto) },
  })
  async create(
    @User() user: UserPayload,
    @Body(new ZodValidationPipe(CreateFeedbackSchema)) data: CreateFeedbackDto,
  ): Promise<FeedbackBaseResponseDto> {
    const result = await this.feedback.create(user.id, data);

    return {
      message: MESSAGES.RESOURCE_CREATED,
      data: result,
    };
  }


  /// Обновление обратной связи
  @Patch(':id')
  @ApiExtraModels(FeedbackBaseResponseDto)
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FeedbackBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  async update(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @User() user: UserPayload,
    @Body(new ZodValidationPipe(UpdateFeedbackSchema)) data: UpdateFeedbackDto,
  ): Promise<FeedbackBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.feedback.update(user.id, id, data);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }


  /// Логическое удаление обратной связи
  @Patch('delete/:id')
  @ApiExtraModels(FeedbackBaseResponseDto)
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FeedbackBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  async delete(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @User() user: UserPayload,
  ): Promise<FeedbackBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.feedback.delete(user.id, id);

    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result,
    };
  }


  /// Согласование обратной связи (акцепт / отказ)
  @Patch('accept/:id')
  @ApiExtraModels(FeedbackBaseResponseDto)
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FeedbackBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  async accept(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @Body(new ZodValidationPipe(AcceptFeedbackSchema)) data: AcceptFeedbackDto,
  ): Promise<FeedbackBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.feedback.accept(user.id, id, data);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }


  /// Изменение порядка расположения обратных связей
  @Patch('reorder/:ftsFunctionDetailId')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FeedbackItemsResponseDto) },
  })
  @ApiExtraModels(FeedbackItemsResponseDto)
  async reorderFeedbacks(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(FeedbackQuerySchema)) params: FeedbackQueryDto,
    @Body(new ZodValidationPipe(ReorderFeedbacksSchema)) data: ReorderFeedbacksDto,
  ): Promise<FeedbackItemsResponseDto> {
    const result = await this.feedback.reorderFeedbacks(user.id, params.ftsFunctionDetailId, data.orderedIds);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }
}
