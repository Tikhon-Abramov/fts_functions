import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Header, Res, StreamableFile } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { SWAGGER_DESCRIPTION } from '@common/strings';

import {
  BatchAttachDtisRequestDto,
  BatchAttachDtisRequestSchema,
  CreateFtsFunctionDetailDto,
  CreateFtsFunctionDetailSchema,
  CreateFtsFunctionDto,
  CreateFtsFunctionSchema,
  CreateFtsFunctionTreeDto,
  CreateFtsFunctionTreeSchema,
  DetailIdParamDto,
  DetailIdParamSchema,
  DtiParamDto,
  DtiParamSchema,
  FtsFunctionBaseResponseDto,
  FtsFunctionDetailDetailedResponseDto,
  FtsFunctionDetailedResponseDto,
  FtsFunctionListQueryDto,
  FtsFunctionListQuerySchema,
  FtsFunctionListResponseDto,
  FtsFunctionToDtiResponseDto,
  FtsFunctionTreeResponseDto,
  IdParamDto,
  IdParamSchema,
  TreeEdgeParamDto,
  TreeEdgeParamSchema,
  UpdateFtsFunctionDetailDto,
  UpdateFtsFunctionDetailSchema,
  UpdateFtsFunctionDto,
  UpdateFtsFunctionSchema,
  CreateFeedbackSchema,
  UpdateFeedbackSchema,
  AcceptFeedbackSchema,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  AcceptFeedbackDto,
  FeedbackResponseDto,
  FeedbackIdParamDto,
  FeedbackIdParamSchema,
  CreateActionSchema,
  UpdateActionSchema,
  ActionIdParamSchema,
  CreateActionDto,
  UpdateActionDto,
  ActionIdParamDto,
  ActionSchema,
  ActionResponseDto,
} from './fts-function.schema';
import { FtsFunctionService } from './fts-function.service';


const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


// TODO: auth-gating these endpoints is a follow-up product decision (see
// docs/known-limitations.md). For now @Public() opens them to anonymous users.
@Controller({
  path: 'fts-functions',
  version: '1',
})
export class FtsFunctionController {
  constructor(private readonly service: FtsFunctionService) {}

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // LIST / DETAIL
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  @Get()
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FtsFunctionListResponseDto) },
  })
  @ApiExtraModels(FtsFunctionListResponseDto, FtsFunctionBaseResponseDto)
  list(
    @Query(new ZodValidationPipe(FtsFunctionListQuerySchema))
    query: FtsFunctionListQueryDto,
  ): Promise<FtsFunctionListResponseDto> {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_FOUND,
    schema: { $ref: getSchemaPath(FtsFunctionDetailedResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailedResponseDto)
  getById(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto,
  ): Promise<FtsFunctionDetailedResponseDto> {
    return this.service.getById(params.id);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // FtsFunction CRUD
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  @Post()
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FtsFunctionBaseResponseDto) },
  })
  @ApiExtraModels(FtsFunctionBaseResponseDto)
  create(
    @Body(new ZodValidationPipe(CreateFtsFunctionSchema))
    body: CreateFtsFunctionDto,
  ): Promise<FtsFunctionBaseResponseDto> {
    return this.service.create(body);
  }

  @Patch(':id')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FtsFunctionBaseResponseDto) },
  })
  @ApiExtraModels(FtsFunctionBaseResponseDto)
  update(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto,
    @Body(new ZodValidationPipe(UpdateFtsFunctionSchema))
    body: UpdateFtsFunctionDto,
  ): Promise<FtsFunctionBaseResponseDto> {
    return this.service.update(params.id, body);
  }

  @Delete(':id')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FtsFunctionBaseResponseDto) },
  })
  @ApiExtraModels(FtsFunctionBaseResponseDto)
  softDelete(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto,
  ): Promise<FtsFunctionBaseResponseDto> {
    return this.service.softDelete(params.id);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // FtsFunctionDetail CRUD
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  @Post(':id/details')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailDetailedResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailDetailedResponseDto)
  createDetail(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto,
    @Body(new ZodValidationPipe(CreateFtsFunctionDetailSchema))
    body: CreateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailDetailedResponseDto> {
    return this.service.createDetail(params.id, body);
  }

  @Patch('details/:detailId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailDetailedResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailDetailedResponseDto)
  updateDetail(
    @Param(new ZodValidationPipe(DetailIdParamSchema)) params: DetailIdParamDto,
    @Body(new ZodValidationPipe(UpdateFtsFunctionDetailSchema)) body: UpdateFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailDetailedResponseDto> {
    return this.service.updateDetail(params.detailId, body);
  }
  



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Feedback CRUD
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  @Post('details/:detailId/feedbacks')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FeedbackResponseDto) },
  })
  @ApiExtraModels(FeedbackResponseDto)
  createFeedback(
    @Param(new ZodValidationPipe(DetailIdParamSchema)) params: DetailIdParamDto,
    @Body(new ZodValidationPipe(CreateFeedbackSchema)) body: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    return this.service.createFeedback(params.detailId, body);
  }

  @Patch('feedbacks/:feedbackId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FeedbackResponseDto) },
  })
  @ApiExtraModels(FeedbackResponseDto)
  updateFeedback(
    @Param(new ZodValidationPipe(FeedbackIdParamSchema)) params: FeedbackIdParamDto,
    @Body(new ZodValidationPipe(UpdateFeedbackSchema)) body: UpdateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    return this.service.updateFeedback(params.feedbackId, body);
  }

  @Patch('feedbacks/accept/:feedbackId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FeedbackResponseDto) },
  })
  @ApiExtraModels(FeedbackResponseDto)
  acceptFeedback(
    @Param(new ZodValidationPipe(FeedbackIdParamSchema)) params: FeedbackIdParamDto,
    @Body(new ZodValidationPipe(AcceptFeedbackSchema)) body: AcceptFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    return this.service.acceptFeedback(
      params.feedbackId,
      body.isAccepted,
      body.rejectComment,
    );
  }

  @Delete('feedbacks/:feedbackId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FeedbackResponseDto) },
  })
  @ApiExtraModels(FeedbackResponseDto)
  deleteFeedback(
    @Param(new ZodValidationPipe(FeedbackIdParamSchema)) params: FeedbackIdParamDto,
  ): Promise<FeedbackResponseDto> {
    return this.service.deleteFeedback(params.feedbackId);
  }




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Action CRUD
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  @Post('details/:detailId/actions')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(ActionResponseDto) },
  })
  @ApiExtraModels(ActionResponseDto)
  creatAction(
    @Param(new ZodValidationPipe(DetailIdParamSchema)) params: DetailIdParamDto,
    @Body(new ZodValidationPipe(CreateActionSchema)) body: CreateActionDto,
  ): Promise<ActionResponseDto> {
    return this.service.createAction(params.detailId, body);
  }

  @Patch('actions/:actionId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(ActionResponseDto) },
  })
  @ApiExtraModels(ActionResponseDto)
  updateAction(
    @Param(new ZodValidationPipe(ActionIdParamSchema)) params: ActionIdParamDto,
    @Body(new ZodValidationPipe(UpdateActionSchema)) body: UpdateActionDto,
  ): Promise<ActionResponseDto> {
    return this.service.updateAction(params.actionId, body);
  }

  @Delete('actions/:actionId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(ActionResponseDto) },
  })
  @ApiExtraModels(ActionResponseDto)
  deleteAction(
    @Param(new ZodValidationPipe(ActionIdParamSchema)) params: ActionIdParamDto,
  ): Promise<ActionResponseDto> {
    return this.service.deleteAction(params.actionId);
  }




  





  @Delete('details/:detailId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailDetailedResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailDetailedResponseDto)
  softDeleteDetail(
    @Param(new ZodValidationPipe(DetailIdParamSchema))
    params: DetailIdParamDto,
  ): Promise<FtsFunctionDetailDetailedResponseDto> {
    return this.service.softDeleteDetail(params.detailId);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Tree edges
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  @Post('tree')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FtsFunctionTreeResponseDto) },
  })
  @ApiExtraModels(FtsFunctionTreeResponseDto)
  createTreeEdge(
    @Body(new ZodValidationPipe(CreateFtsFunctionTreeSchema))
    body: CreateFtsFunctionTreeDto,
  ): Promise<FtsFunctionTreeResponseDto> {
    return this.service.createTreeEdge(body);
  }

  @Delete('tree/:parentId/:childId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FtsFunctionTreeResponseDto) },
  })
  @ApiExtraModels(FtsFunctionTreeResponseDto)
  deleteTreeEdge(
    @Param(new ZodValidationPipe(TreeEdgeParamSchema))
    params: TreeEdgeParamDto,
  ): Promise<FtsFunctionTreeResponseDto> {
    return this.service.deleteTreeEdge(params.parentId, params.childId);
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // DTIs
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // The batch-attach endpoint below is additive-only and must stay that
  // way. The planned full-replace `PUT /v1/fts-functions/:id/dtis` is
  // tracked in `docs/known-limitations.md`.
  @Post(':id/dtis/batch')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailedResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailedResponseDto)
  batchAttachDtisV1(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto,
    @Body(new ZodValidationPipe(BatchAttachDtisRequestSchema))
    body: BatchAttachDtisRequestDto,
  ): Promise<FtsFunctionDetailedResponseDto> {
    return this.service.batchAttachDtis(params.id, body.dtiIds);
  }

  @Post(':id/dtis/:dtiId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(FtsFunctionToDtiResponseDto) },
  })
  @ApiExtraModels(FtsFunctionToDtiResponseDto)
  attachDti(
    @Param(new ZodValidationPipe(DtiParamSchema)) params: DtiParamDto,
  ): Promise<FtsFunctionToDtiResponseDto> {
    return this.service.attachDti(params.id, params.dtiId);
  }

  @Delete(':id/dtis/:dtiId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_DELETED,
    schema: { $ref: getSchemaPath(FtsFunctionToDtiResponseDto) },
  })
  @ApiExtraModels(FtsFunctionToDtiResponseDto)
  detachDti(
    @Param(new ZodValidationPipe(DtiParamSchema)) params: DtiParamDto,
  ): Promise<FtsFunctionToDtiResponseDto> {
    return this.service.detachDti(params.id, params.dtiId);
  }

  @Get('download')
  @ApiOperation({
    summary: 'Скачивание выгрузки по функциям',
    description: 'Выгружает все функции с их детализациями в формате XLSX-файла.',
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
    return new StreamableFile(Buffer.from(buffer as ArrayBuffer), {
      type: XLSX_MIME,
      disposition: 'attachment; filename="fts-functions.xlsx"',
    });
  }
}
