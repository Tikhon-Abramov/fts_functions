import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { SWAGGER_DESCRIPTION } from '@common/strings';

import {
  AcceptFtsFunctionDetailDto,
  AcceptFtsFunctionDetailSchema,
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
} from './fts-function.schema';
import { FtsFunctionService } from './fts-function.service';

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
  
  @Patch('details/accept/:detailId')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(FtsFunctionDetailDetailedResponseDto) },
  })
  @ApiExtraModels(FtsFunctionDetailDetailedResponseDto)
  acceptDetail(
    @Param(new ZodValidationPipe(DetailIdParamSchema)) params: DetailIdParamDto,
    @Body(new ZodValidationPipe(AcceptFtsFunctionDetailSchema)) body: AcceptFtsFunctionDetailDto,
  ): Promise<FtsFunctionDetailDetailedResponseDto> {
    return this.service.acceptDetail(params.detailId, body.isAccepted, body.rejectComment);
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
}
