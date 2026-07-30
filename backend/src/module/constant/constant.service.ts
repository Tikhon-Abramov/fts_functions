import { Injectable } from '@nestjs/common';
import { Prisma, Category } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TypeQueryDto, UserQueryDto, TypeResponseDto, UserResponseDto } from './constant.schema';
import { TypeSelect, UserSelect } from './constant.select';

@Injectable()
export class ConstantService {
  constructor(private readonly prisma: PrismaService) {}

  getTypes(query: TypeQueryDto): Promise<TypeResponseDto[]> {
    const where: Prisma.TypeWhereInput = {
      isDeleted: false,
    };

    if (query.codes)
      where.code = { in: query.codes };
    if (query.categories)
      where.category = { in: query.categories };
    if (query.supertypeIds)
      where.supertypeId = { in: query.supertypeIds };
    
    return this.prisma.type.findMany({
      where,
      select: TypeSelect,
      orderBy: [{ order: 'asc' }, { id: 'desc' }],
    });
  }


  getUsers(query: UserQueryDto): Promise<UserResponseDto[]> {
    const where: Prisma.UserWhereInput = {
      isDeleted: false,
    };

    if (query.roles)
      where.role = { in: query.roles };
    if (query.ftsPositionRoles)
      where.ftsPositionRole = { in: query.ftsPositionRoles };
    if (query.ftsFunctionRoles)
      where.ftsFunctionRole = { in: query.ftsFunctionRoles };
    if (query.ftsBranchTypes)
      where.ftsBranchType = { in: query.ftsBranchTypes };


    return this.prisma.user.findMany({
      where,
      select: UserSelect,
    });
  }
}
