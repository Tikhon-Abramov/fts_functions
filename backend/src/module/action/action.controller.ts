import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiNotFoundResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { User } from '@common/decorators/user.decorator';
import { UserPayload } from '@common/interfaces/user-payload.interface';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { IdParamSchema, IdParamsDto } from '@common/schemas/id.schema';
import { ErrorResponseDto } from '@common/schemas/error-response.schema';
import { MESSAGES } from '@common/constants';
import { ActionService } from './action.service';
import {
  CreateActionSchema,
  CreateActionDto,
  UpdateActionSchema,
  UpdateActionDto,
  ActionItemsResponseDto,
  ActionBaseResponseDto,
  ActionQuerySchema,
  ActionQueryDto,
  CreateActionsFeedbackSchema,
  CreateActionsFeedbackDto,
  UpdateActionsFeedbackSchema,
  UpdateActionsFeedbackDto,
  GeneralInfoActionsResponseDto,
  UpdateGeneralInfoActionsSchema,
  UpdateGeneralInfoActionsDto,
  ReorderActionsSchema,
  ReorderActionsDto,
} from './action.schema';


@UseGuards(JwtAuthGuard)
@Controller({
  path: 'actions',
  version: '1',
})
export class ActionController {
  constructor(private readonly action: ActionService) {}


  /// Получение общей информации о действиях
  @Get('action-info/:ftsFunctionDetailId')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(GeneralInfoActionsResponseDto) },
  })
  @ApiExtraModels(GeneralInfoActionsResponseDto)
  async getGeneralInfoActions(
      @Param(new ZodValidationPipe(ActionQuerySchema)) params: ActionQueryDto,
  ): Promise<GeneralInfoActionsResponseDto> {
    const data = await this.action.getGeneralInfoActions(params.ftsFunctionDetailId);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    };
  }

  
  /// Обновление общей информации о действиях
  @Patch('action-info/:ftsFunctionDetailId')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(GeneralInfoActionsResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(GeneralInfoActionsResponseDto)
  async updateGeneralInfoActions(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(ActionQuerySchema)) params: ActionQueryDto,
    @Body(new ZodValidationPipe(UpdateGeneralInfoActionsSchema)) data: UpdateGeneralInfoActionsDto,
  ): Promise<GeneralInfoActionsResponseDto> {
    const result = await this.action.updateGeneralInfoActions(user.id, params.ftsFunctionDetailId, data);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }


  /// Получение всего списка действий для выбранной детализации
  @Get(':ftsFunctionDetailId')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(ActionItemsResponseDto) },
  })
  @ApiExtraModels(ActionItemsResponseDto)
  async getAllActions(
      @Param(new ZodValidationPipe(ActionQuerySchema)) params: ActionQueryDto,
  ): Promise<ActionItemsResponseDto> {
    const data = await this.action.getAllActions(params.ftsFunctionDetailId);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    };
  }


  /// Получение действия по ID
  @Get('info/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(ActionBaseResponseDto) },
  })
  @ApiExtraModels(ActionBaseResponseDto)
  async getActionById(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<ActionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const data = await this.action.getActionById(id);

    return {
      message: MESSAGES.RESOURCE_FOUND,
      data,
    }
  }


  /// Создание действия
  @Post()
  @ApiCreatedResponse({
    description: MESSAGES.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(ActionBaseResponseDto) },
  })
  @ApiExtraModels(ActionBaseResponseDto)
  async create(
    @User() user: UserPayload,
    @Body(new ZodValidationPipe(CreateActionSchema)) data: CreateActionDto,
  ): Promise<ActionBaseResponseDto> {
    const result = await this.action.create(user.id, data);

    return {
      message: MESSAGES.RESOURCE_CREATED,
      data: result,
    };
  }


  /// Обновление действия
  @Patch(':id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(ActionBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(ActionBaseResponseDto)
  async update(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @Body(new ZodValidationPipe(UpdateActionSchema)) data: UpdateActionDto,
  ): Promise<ActionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.action.update(user.id, id, data);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }


  /// Логическое удаление действия
  @Patch('delete/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(ActionBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(ActionBaseResponseDto)
  async delete(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<ActionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.action.delete(user.id, id);

    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result,
    };
  }


  /// Добавление обратной связи действия
  @Patch('feedback/create/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(ActionBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(ActionBaseResponseDto)
  async createFeedback(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @Body(new ZodValidationPipe(CreateActionsFeedbackSchema)) data: CreateActionsFeedbackDto,
  ): Promise<ActionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.action.createFeedback(user.id, id, data);

    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result,
    };
  }
  

  /// Обновление обратной связи действия
  @Patch('feedback/update/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(ActionBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(ActionBaseResponseDto)
  async updateFeedback(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
    @Body(new ZodValidationPipe(UpdateActionsFeedbackSchema)) data: UpdateActionsFeedbackDto,
  ): Promise<ActionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.action.updateFeedback(user.id, id, data);

    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result,
    };
  }


  /// Удаление обратной связи действия
  @Patch('feedback/delete/:id')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(ActionBaseResponseDto) },
  })
  @ApiNotFoundResponse({
    description: MESSAGES.NOT_FOUND,
    schema: { $ref: getSchemaPath(ErrorResponseDto) },
  })
  @ApiExtraModels(ActionBaseResponseDto)
  async deleteFeedback(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamsDto,
  ): Promise<ActionBaseResponseDto> {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      throw new NotFoundException(MESSAGES.NOT_FOUND);
    }

    const result = await this.action.deleteFeedback(user.id, id);

    return {
      message: MESSAGES.RESOURCE_DELETED,
      data: result,
    };
  }


  /// Изменение порядка расположения операций
  @Patch('reorder/:ftsFunctionDetailId')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(ActionItemsResponseDto) },
  })
  @ApiExtraModels(ActionItemsResponseDto)
  async reorderActions(
    @User() user: UserPayload,
    @Param(new ZodValidationPipe(ActionQuerySchema)) params: ActionQueryDto,
    @Body(new ZodValidationPipe(ReorderActionsSchema)) data: ReorderActionsDto,
  ): Promise<ActionItemsResponseDto> {
    const result = await this.action.reorderActions(user.id, params.ftsFunctionDetailId, data.orderedIds);

    return {
      message: MESSAGES.RESOURCE_UPDATED,
      data: result,
    };
  }
}
