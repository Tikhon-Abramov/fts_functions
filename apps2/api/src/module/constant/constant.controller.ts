import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { SWAGGER_DESCRIPTION } from '@common/strings';

import {
  IdParamDto,
  IdParamSchema,
  TypeCreateDto,
  TypeCreateSchema,
  TypeQueryDto,
  TypeQuerySchema,
  TypeResponseDto,
  TypeUpdateDto,
  TypeUpdateSchema,
  UserCreateDto,
  UserCreateSchema,
  UserQueryDto,
  UserQuerySchema,
  UserResponseDto,
  UserUpdateDto,
  UserUpdateSchema,
} from './constant.schema';
import { ConstantService } from './constant.service';

/**
 * `ConstantController` — admin CRUD на справочниках Type / User плюс
 * read-эндпоинты.
 *
 * FTS internal-only deploy: эндпоинты доступны без авторизации через
 * maintenance-маршрут (см. `docs/deployment-profile.md`). AuditLog пишется
 * с `actorUserId = null`.
 */
@Controller({
  path: 'constants',
  version: '1',
})
export class ConstantController {
  constructor(private readonly constants: ConstantService) {}

  // ── Type READ ──────────────────────────────────────────────────────────────

  @Get('type')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_FOUND,
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(TypeResponseDto) },
    },
  })
  @ApiExtraModels(TypeResponseDto)
  getTypes(
    @Query(new ZodValidationPipe(TypeQuerySchema)) query: TypeQueryDto,
  ): Promise<TypeResponseDto[]> {
    return this.constants.getTypes(query);
  }

  // ── Type WRITE ─────────────────────────────────────────────────────────────

  @Post('type')
  @ApiCreatedResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(TypeResponseDto) },
  })
  @ApiExtraModels(TypeResponseDto)
  createType(
    @Body(new ZodValidationPipe(TypeCreateSchema)) body: TypeCreateDto,
  ): Promise<TypeResponseDto> {
    return this.constants.createType(body, null);
  }

  @Patch('type/:id')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(TypeResponseDto) },
  })
  @ApiExtraModels(TypeResponseDto)
  updateType(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto,
    @Body(new ZodValidationPipe(TypeUpdateSchema)) body: TypeUpdateDto,
  ): Promise<TypeResponseDto> {
    return this.constants.updateType(params.id, body, null);
  }

  @Delete('type/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: SWAGGER_DESCRIPTION.RESOURCE_DELETED })
  deleteType(@Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto): Promise<void> {
    return this.constants.deleteType(params.id, null);
  }

  // ── User READ ──────────────────────────────────────────────────────────────

  @Get('user')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_FOUND,
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(UserResponseDto) },
    },
  })
  @ApiExtraModels(UserResponseDto)
  getUsers(
    @Query(new ZodValidationPipe(UserQuerySchema)) query: UserQueryDto,
  ): Promise<UserResponseDto[]> {
    return this.constants.getUsers(query);
  }

  // ── User WRITE ─────────────────────────────────────────────────────────────

  @Post('user')
  @ApiCreatedResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_CREATED,
    schema: { $ref: getSchemaPath(UserResponseDto) },
  })
  @ApiExtraModels(UserResponseDto)
  createUser(
    @Body(new ZodValidationPipe(UserCreateSchema)) body: UserCreateDto,
  ): Promise<UserResponseDto> {
    return this.constants.createUser(body, null);
  }

  @Patch('user/:id')
  @ApiOkResponse({
    description: SWAGGER_DESCRIPTION.RESOURCE_UPDATED,
    schema: { $ref: getSchemaPath(UserResponseDto) },
  })
  @ApiExtraModels(UserResponseDto)
  updateUser(
    @Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto,
    @Body(new ZodValidationPipe(UserUpdateSchema)) body: UserUpdateDto,
  ): Promise<UserResponseDto> {
    return this.constants.updateUser(params.id, body, null);
  }

  @Delete('user/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: SWAGGER_DESCRIPTION.RESOURCE_DELETED })
  deleteUser(@Param(new ZodValidationPipe(IdParamSchema)) params: IdParamDto): Promise<void> {
    return this.constants.deleteUser(params.id, null);
  }
}
