import { Controller, Get, Query } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ZodValidationPipe } from '@common/pipes/validation.pipe';
import { ConstantService } from './constant.service';
import { MESSAGES } from '@common/constants';
import { TypeQuerySchema, UserQuerySchema, TypeQueryDto, UserQueryDto, TypeResponseDto, UserResponseDto } from './constant.schema';


@Controller({
  path: 'constants',
  version: '1',
})
export class ConstantController {
  constructor(private readonly constants: ConstantService) {}


  @Get('type')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
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


  @Get('user')
  @ApiOkResponse({
    description: MESSAGES.RESOURCE_FOUND,
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
}
