import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

import { Category } from '@prisma-client';

const intFromStringOrNumber = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'string' ? Number(v) : v))
  .pipe(z.number().int());

const positiveInt = intFromStringOrNumber.pipe(z.number().int().positive());

const idArrayQuery = z
  .union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
  .transform((v) => (Array.isArray(v) ? v : [v]))
  .pipe(z.array(intFromStringOrNumber.pipe(z.number().int().positive())));

const boolFromString = z
  .union([z.string(), z.boolean()])
  .transform((v) => {
    if (typeof v === 'boolean') return v;
    return v === 'true' || v === '1';
  })
  .pipe(z.boolean());

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PATH PARAMS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const IdParamSchema = z.object({
  id: positiveInt,
});

export const DetailIdParamSchema = z.object({
  detailId: positiveInt,
});

export const DtiParamSchema = z.object({
  id: positiveInt,
  dtiId: positiveInt,
});

export const TreeEdgeParamSchema = z.object({
  parentId: positiveInt,
  childId: positiveInt,
});

export class IdParamDto extends createZodDto(IdParamSchema) {}
export class DetailIdParamDto extends createZodDto(DetailIdParamSchema) {}
export class DtiParamDto extends createZodDto(DtiParamSchema) {}
export class TreeEdgeParamDto extends createZodDto(TreeEdgeParamSchema) {}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LIST QUERY
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const FtsFunctionListQuerySchema = z.object({
  competencyCenterIds: idArrayQuery.optional(),
  ftsFunctionNameIds: idArrayQuery.optional(),
  ftsFunctionMarkerIds: idArrayQuery.optional(),
  curatorCentralOfficeIds: idArrayQuery.optional(),
  managerInterregionalInspectionIds: idArrayQuery.optional(),
  // Numeric filters on FtsFunction.id — backing the DataGrid "ID" column's
  // filter operators (=, !=, >, >=, <, <=, isAnyOf).
  ids: idArrayQuery.optional(),
  idNot: positiveInt.optional(),
  idGt: positiveInt.optional(),
  idGte: positiveInt.optional(),
  idLt: positiveInt.optional(),
  idLte: positiveInt.optional(),
  includeDeleted: boolFromString.optional(),
  search: z.string().trim().min(1).max(256).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'id']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export class FtsFunctionListQueryDto extends createZodDto(FtsFunctionListQuerySchema) {}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BODY DTOs — FtsFunction
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CreateFtsFunctionSchema = z.object({
  ftsCentralizationId: positiveInt,
  ftsFunctionNameId: positiveInt,
  competencyCenterId: positiveInt,
  ftsFunctionMarkerId: positiveInt,
  curatorCentralOfficeId: positiveInt,
  managerInterregionalInspectionId: positiveInt,
  departmentHeadCentralOfficeId: positiveInt,
  departmentHeadInterregionalInspectionId: positiveInt,
});

export const UpdateFtsFunctionSchema = CreateFtsFunctionSchema.partial();

export class CreateFtsFunctionDto extends createZodDto(CreateFtsFunctionSchema) {}
export class UpdateFtsFunctionDto extends createZodDto(UpdateFtsFunctionSchema) {}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BODY DTOs — FtsFunctionDetail
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CreateFtsFunctionDetailSchema = z.object({
  ftsFunctionStepId: positiveInt,
  ftsFunctionCategoryId: positiveInt.nullable().optional(),
  ftsFunctionComplexityId: positiveInt.nullable().optional(),
  ftsFunctionExecutionFrequencyId: positiveInt.nullable().optional(),
  whoPerformsActionId: positiveInt.nullable().optional(),
  ftsFunctionActionTypeId: positiveInt.nullable().optional(),
  ftsFunctionEffectivenessId: positiveInt.nullable().optional(),
  technologicalSolutionId: positiveInt.nullable().optional(),
  feedbackSourceId: positiveInt.nullable().optional(),
  responsibleId: positiveInt.nullable().optional(),
  ftsMethodologyStatusId: positiveInt.nullable().optional(),
  ftsFunctionDetails: z.string().nullable().optional(),
  basis: z.string().nullable().optional(),
  artifact: z.string().nullable().optional(),
  artifactUsage: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  algorithm: z.string().nullable().optional(),
  problemDescription: z.string().nullable().optional(),
  initiatorRequisites: z.string().nullable().optional(),
  deadline: z.date().nullable().optional(),
  isAccepted: z.boolean().nullable().optional(),
  rejectComment: z.string().nullable().optional(),
});

export const UpdateFtsFunctionDetailSchema = CreateFtsFunctionDetailSchema.partial();

export class CreateFtsFunctionDetailDto extends createZodDto(CreateFtsFunctionDetailSchema) {}
export class UpdateFtsFunctionDetailDto extends createZodDto(UpdateFtsFunctionDetailSchema) {}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BODY DTOs — FtsFunctionTree
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CreateFtsFunctionTreeSchema = z.object({
  parentFtsFunctionId: positiveInt,
  childFtsFunctionId: positiveInt,
  relationTypeId: positiveInt,
});

export class CreateFtsFunctionTreeDto extends createZodDto(CreateFtsFunctionTreeSchema) {}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// RESPONSE DTOs
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const typeMinimalSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  category: z.nativeEnum(Category),
});

const userMinimalSchema = z.object({
  id: z.number(),
  shortName: z.string().nullable(),
  fullName: z.string().nullable(),
});

export const FtsFunctionBaseResponseSchema = z.object({
  id: z.number(),
  ftsCentralizationId: z.number(),
  ftsFunctionNameId: z.number(),
  competencyCenterId: z.number(),
  ftsFunctionMarkerId: z.number(),
  curatorCentralOfficeId: z.number(),
  managerInterregionalInspectionId: z.number(),
  departmentHeadCentralOfficeId: z.number(),
  departmentHeadInterregionalInspectionId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isDeleted: z.boolean(),
  deletedAt: z.date().nullable(),
});

// List items extend the base shape with a minimal projection of the DTI
// join — backs the registry table's "Стратегия Д" column. Field name and
// nesting mirror Prisma's `dtis: { dti: {...} }[]` payload (see
// `ftsFunctionListSelect`).
const FtsFunctionListItemResponseSchema = FtsFunctionBaseResponseSchema.extend({
  dtis: z.array(
    z.object({
      dti: z.object({
        id: z.number(),
        name: z.string(),
        code: z.string(),
      }),
    }),
  ),
});

export const FtsFunctionListResponseSchema = z.object({
  items: z.array(FtsFunctionListItemResponseSchema),
  filteredTotal: z.number(),
  overallTotal: z.number(),
});

const FtsFunctionDetailBaseResponseSchema = z.object({
  id: z.number(),
  ftsFunctionId: z.number(),
  ftsFunctionStepId: z.number(),
  ftsFunctionCategoryId: z.number().nullable(),
  ftsFunctionComplexityId: z.number().nullable(),
  ftsFunctionExecutionFrequencyId: z.number().nullable(),
  whoPerformsActionId: z.number().nullable(),
  ftsFunctionActionTypeId: z.number().nullable(),
  ftsFunctionEffectivenessId: z.number().nullable(),
  technologicalSolutionId: positiveInt.nullable().optional(),
  feedbackSourceId: positiveInt.nullable().optional(),
  responsibleId: positiveInt.nullable().optional(),
  ftsMethodologyStatusId: positiveInt.nullable().optional(),
  ftsFunctionDetails: z.string().nullable(),
  basis: z.string().nullable(),
  artifact: z.string().nullable(),
  artifactUsage: z.string().nullable(),
  purpose: z.string().nullable(),
  number: z.string().nullable().optional(),
  algorithm: z.string().nullable().optional(),
  problemDescription: z.string().nullable().optional(),
  initiatorRequisites: z.string().nullable().optional(),
  deadline: z.date().nullable().optional(),
  isAccepted: z.boolean().nullable().optional(),
  rejectComment: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isDeleted: z.boolean(),
  deletedAt: z.date().nullable(),
});

const FtsFunctionTreeEdgeResponseSchema = z.object({
  parentFtsFunctionId: z.number(),
  childFtsFunctionId: z.number(),
  relationTypeId: z.number(),
  createdAt: z.date(),
  relationType: typeMinimalSchema,
});

const FtsFunctionDetailDetailedResponseSchema = FtsFunctionDetailBaseResponseSchema.extend({
  ftsFunctionStep: typeMinimalSchema,
  ftsFunctionCategory: typeMinimalSchema.nullable(),
  ftsFunctionComplexity: typeMinimalSchema.nullable(),
  ftsFunctionExecutionFrequency: typeMinimalSchema.nullable(),
  whoPerformsAction: typeMinimalSchema.nullable(),
  ftsFunctionActionType: typeMinimalSchema.nullable(),
  ftsFunctionEffectiveness: typeMinimalSchema.nullable(),
  technologicalSolution: typeMinimalSchema.nullable(),
  feedbackSource: typeMinimalSchema.nullable(),
  responsible: typeMinimalSchema.nullable(),
  ftsMethodologyStatus: typeMinimalSchema.nullable(),
});

const FtsFunctionDetailInDetailedResponseSchema = FtsFunctionDetailDetailedResponseSchema.extend({
  parents: z.array(FtsFunctionTreeEdgeResponseSchema),
  children: z.array(FtsFunctionTreeEdgeResponseSchema),
});

export const FtsFunctionDetailedResponseSchema = FtsFunctionBaseResponseSchema.extend({
  ftsCentralization: typeMinimalSchema,
  ftsFunctionName: typeMinimalSchema,
  competencyCenter: typeMinimalSchema,
  ftsFunctionMarker: typeMinimalSchema,
  curatorCentralOffice: userMinimalSchema,
  managerInterregionalInspection: userMinimalSchema,
  departmentHeadCentralOffice: userMinimalSchema,
  departmentHeadInterregionalInspection: userMinimalSchema,
  dtis: z.array(
    z.object({
      dtiId: z.number(),
      createdAt: z.date(),
      dti: typeMinimalSchema,
    }),
  ),
  ftsFunctionDetails: z.array(FtsFunctionDetailInDetailedResponseSchema),
});

export const FtsFunctionTreeResponseSchema = z.object({
  parentFtsFunctionId: z.number(),
  childFtsFunctionId: z.number(),
  relationTypeId: z.number(),
  createdAt: z.date(),
});

export const FtsFunctionToDtiResponseSchema = z.object({
  ftsFunctionId: z.number(),
  dtiId: z.number(),
  createdAt: z.date(),
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BODY DTOs — Batch attach DTIs
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const BatchAttachDtisRequestSchema = z.object({
  dtiIds: z.array(z.number().int().positive()).min(0),
});

export class BatchAttachDtisRequestDto extends createZodDto(BatchAttachDtisRequestSchema) {}

export class FtsFunctionBaseResponseDto extends createZodDto(FtsFunctionBaseResponseSchema) {}
export class FtsFunctionListResponseDto extends createZodDto(FtsFunctionListResponseSchema) {}
export class FtsFunctionDetailedResponseDto extends createZodDto(
  FtsFunctionDetailedResponseSchema,
) {}
export class FtsFunctionDetailDetailedResponseDto extends createZodDto(
  FtsFunctionDetailDetailedResponseSchema,
) {}
export class FtsFunctionTreeResponseDto extends createZodDto(FtsFunctionTreeResponseSchema) {}
export class FtsFunctionToDtiResponseDto extends createZodDto(FtsFunctionToDtiResponseSchema) {}
