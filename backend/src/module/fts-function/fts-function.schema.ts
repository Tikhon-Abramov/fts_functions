import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { BaseResponseSchema, idArrayQuery, positiveInt } from '@common/schemas';
import { TypeResponseSchema, UserResponseSchema } from '../constant/constant.schema';



////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// QUERY (filter / sort) /////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

const FtsFunctionFilter = z.object({
  ids: idArrayQuery.optional(),
  ftsFunctionNameIds: idArrayQuery.optional(),
  competencyCenterIds: idArrayQuery.optional(),
  ftsFunctionMarkerIds: idArrayQuery.optional(),
  ftsCentralizationIds: idArrayQuery.optional(),
  dtiIds: idArrayQuery.optional(),
  curatorCentralOfficeIds: idArrayQuery.optional(),
  managerInterregionalInspectionIds: idArrayQuery.optional(),
  departmentHeadCentralOfficeIds: idArrayQuery.optional(),
  departmentHeadInterregionalInspectionIds: idArrayQuery.optional(),
});

const FtsFunctionSort = z.object({
  field: z.enum([
    'id',
    'competencyCenterId',
    'ftsFunctionNameId',
    'ftsFunctionMarkerId',
    'ftsCentralizationId',
    'curatorCentralOfficeId',
    'managerInterregionalInspectionId',
    'departmentHeadCentralOfficeId',
    'departmentHeadInterregionalInspectionId',
  ]),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const FtsFunctionQuerySchema = z.object({
  filter: FtsFunctionFilter.optional(),
  sort: z.union([
    z.string().transform(val => {
      try {
        return JSON.parse(val) as z.infer<typeof FtsFunctionSort>[];
      } catch {
        return [JSON.parse(val)] as z.infer<typeof FtsFunctionSort>[];
      }
    }),
    z.array(FtsFunctionSort),
    FtsFunctionSort
  ]).optional(),
});

export class FtsFunctionSortDto extends createZodDto(FtsFunctionSort) {};
export class FtsFunctionFilterDto extends createZodDto(FtsFunctionFilter) {};
export class FtsFunctionQueryDto extends createZodDto(FtsFunctionQuerySchema) {};


////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// BODY (create / update) ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const CreateFtsFunctionSchema = z.object({
  ftsCentralizationId: positiveInt,
  ftsFunctionNameId: positiveInt,
  otherFtsFunctionName: z.string().optional(),
  ftsFunctionMarkerId: positiveInt,
  competencyCenterId: positiveInt,
  curatorCentralOfficeId: positiveInt,
  managerInterregionalInspectionId: positiveInt,
  departmentHeadCentralOfficeId: positiveInt,
  departmentHeadInterregionalInspectionId: positiveInt,
  dtiIds: z.array(positiveInt).optional(),
});

export const UpdateFtsFunctionSchema = CreateFtsFunctionSchema.partial();

export class CreateFtsFunctionDto extends createZodDto(CreateFtsFunctionSchema) {}
export class UpdateFtsFunctionDto extends createZodDto(UpdateFtsFunctionSchema) {}


////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// RESPONSE ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const FtsFunctionSchema = z.object({
  id: positiveInt,
  ftsCentralization: TypeResponseSchema,
  ftsFunctionName: TypeResponseSchema,
  otherFtsFunctionName: z.string().nullable(),
  ftsFunctionMarker: TypeResponseSchema,
  competencyCenter: TypeResponseSchema,
  dtis: z.array(
    z.object({ type: TypeResponseSchema })
  ),
  curatorCentralOffice: UserResponseSchema,
  managerInterregionalInspection: UserResponseSchema,
  departmentHeadCentralOffice: UserResponseSchema,
  departmentHeadInterregionalInspection: UserResponseSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MetaSchema = z.object({
  total: z.number(),
  filteredTotal: z.number(),
});

export const FtsFunctionResponseSchema = z.object({
  items: z.array(FtsFunctionSchema),
  meta: MetaSchema,  
});

export const FtsFunctionItemsResponseSchema = BaseResponseSchema.extend({
  data: FtsFunctionResponseSchema,
});


export const FtsFunctionBaseResponseSchema = BaseResponseSchema.extend({
  data: FtsFunctionSchema,
});


export class FtsFunctionDto extends createZodDto(FtsFunctionSchema) {}
export class FtsFunctionResponseDto extends createZodDto(FtsFunctionResponseSchema) {}
export class MetaDto extends createZodDto(MetaSchema) {}
export class FtsFunctionItemsResponseDto extends createZodDto(FtsFunctionItemsResponseSchema) {}
export class FtsFunctionBaseResponseDto extends createZodDto(FtsFunctionBaseResponseSchema) {}
