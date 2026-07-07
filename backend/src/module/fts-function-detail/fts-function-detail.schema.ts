import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { BaseResponseSchema, positiveInt } from '@common/schemas';
import { TypeResponseSchema } from '../constant/constant.schema';



////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// QUERY /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const FtsFunctionDetailQuerySchema = z.object({
  ftsFunctionId: positiveInt,
});

export const FtsFunctionDetailsRelationQuerySchema = z.object({
  type: z.enum(['UNRELATED', 'RELATED']),
  ftsFunctionId: positiveInt,
  ftsFunctionDetailId: positiveInt,
  ftsFunctionStepId: positiveInt.optional(),
  relationTypeId: positiveInt.optional(),
  search: z.string().optional(),

});

export const FtsFunctionDetailsRelationDeleteQuerySchema = z.object({
  parentFtsFunctionId: positiveInt,
  childFtsFunctionId: positiveInt,
});

export class FtsFunctionDetailQueryDto extends createZodDto(FtsFunctionDetailQuerySchema) { }
export class FtsFunctionDetailsRelationQueryDto extends createZodDto(FtsFunctionDetailsRelationQuerySchema) { }
export class FtsFunctionDetailsRelationDeleteQueryDto extends createZodDto(FtsFunctionDetailsRelationDeleteQuerySchema) { }


////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// BODY (create / update) ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const CreateFtsFunctionDetailSchema = z.object({
  ftsFunctionId: positiveInt,
  ftsFunctionStepId: positiveInt,
  ftsFunctionCategoryId: positiveInt,
  ftsFunctionComplexityId: positiveInt.nullish().optional(),
  ftsFunctionExecutionFrequencyId: positiveInt.nullish().optional(),
  whoPerformsActionId: positiveInt.nullish().optional(),
  personPerformingActionId: positiveInt.nullish().optional(),
  technologicalSolutionId: positiveInt.nullish().optional(),
  responsibleId: positiveInt.nullish().optional(),
  ftsFunctionDetails: z.string().min(1, 'Обязательное поле'),
  actionsСompleteness: z.string().nullish().optional(),
  actionsEffectiveness: z.string().nullish().optional(),
  otherPersonPerformingAction: z.string().nullish().optional(),
  basis: z.string().nullish().optional(),
  artifact: z.string().nullish().optional(),
  artifactUsage: z.string().nullish().optional(),
  number: z.string().max(64, 'Не более 64 символов').nullish().optional(),
});

export const UpdateFtsFunctionDetailSchema = CreateFtsFunctionDetailSchema.partial();

export const CreateFtsFunctionDetailsRelationSchema = z.array(
  z.object({
    parentFtsFunctionId: z.number(),
    childFtsFunctionId: z.number(),
    relationTypeId: z.number(),
  })
);

export const ReorderFtsFunctionDetailSchema = z.object({
  orderedIds: z.array(positiveInt),
});

export class CreateFtsFunctionDetailDto extends createZodDto(CreateFtsFunctionDetailSchema) { }
export class UpdateFtsFunctionDetailDto extends createZodDto(UpdateFtsFunctionDetailSchema) { }

export class CreateFtsFunctionDetailsRelationDto extends createZodDto(CreateFtsFunctionDetailsRelationSchema) { }

export class ReorderFtsFunctionDetailDto extends createZodDto(ReorderFtsFunctionDetailSchema) { }


////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// RESPONSE ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const FtsFunctionDetailPreviewSchema = z.object({
  id: positiveInt,
  ftsFunctionDetails: z.string(),
  ftsFunctionStep: TypeResponseSchema,
  ftsFunctionCategory: TypeResponseSchema,
  whoPerformsAction: TypeResponseSchema.nullable(),
  feedbacks: z.array(
    z.object({ 
      acceptStatus: TypeResponseSchema.nullable()
    })
  ),
  parents: z.array(z.object({ parentFtsFunctionId: z.number() })),
  children: z.array(z.object({ childFtsFunctionId: z.number() })),
});

export const FtsFunctionDetailBaseSchema = z.object({
  id: positiveInt,
  ftsFunctionStep: TypeResponseSchema,
  ftsFunctionCategory: TypeResponseSchema,
  ftsFunctionComplexity: TypeResponseSchema.nullable(),
  ftsFunctionExecutionFrequency: TypeResponseSchema.nullable(),
  whoPerformsAction: TypeResponseSchema.nullable(),
  personPerformingAction: TypeResponseSchema.nullable(),
  technologicalSolution: TypeResponseSchema.nullable(),
  responsible: TypeResponseSchema.nullable(),
  ftsFunctionDetails: z.string(),
  actionsСompleteness: z.string().nullable(),
  actionsEffectiveness: z.string().nullable(),
  otherPersonPerformingAction: z.string().nullable(),
  basis: z.string().nullable(),
  artifact: z.string().nullable(),
  artifactUsage: z.string().nullable(),
  number: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),

  algorithmFiles: z.array(
    z.object({
      id: z.number(),
      objectKey: z.string(),
      originalName: z.string().nullable(),
      mimeType: z.string().nullable(),
      size: z.number().nullable()
    })
  )
});

export const FtsFunctionDetailCategoryGroupSchema = z.object({
  itemsByStep: z.object({
    objectSelection: z.array(FtsFunctionDetailPreviewSchema),
    clusteringImpact: z.array(FtsFunctionDetailPreviewSchema),
  }),
  meta: z.object({
    stepOne: z.number(),
    stepTwo: z.number(),
    countRelations: z.number().optional(),
  }),
})

export const FtsFunctionDetailItemsSchema = z.object({
  itemsByCategory: z.object({
    methodology: FtsFunctionDetailCategoryGroupSchema,
    actualAction: FtsFunctionDetailCategoryGroupSchema,
    controlAnalytics: FtsFunctionDetailCategoryGroupSchema,
  }),
  meta: z.object({
    stepOne: z.number(),
    stepTwo: z.number(),
    countRelations: z.number().optional(),
  }),
});

export const FtsFunctionDetailItemsResponseSchema = BaseResponseSchema.extend({
  data: FtsFunctionDetailItemsSchema,
});

export const FtsFunctionDetailBaseResponseSchema = BaseResponseSchema.extend({
  data: FtsFunctionDetailBaseSchema,
});

export const RelationsSchems = z.array(z.object({ relationType: TypeResponseSchema }));

export const FtsFunctionDetailsRelationItemsSchema = z.array(
  FtsFunctionDetailPreviewSchema.extend({
    parents: RelationsSchems,
    children: RelationsSchems,
  })
);

export const FtsFunctionDetailsRelationSchema = z.object({
  methodology: FtsFunctionDetailsRelationItemsSchema,
  actualAction: FtsFunctionDetailsRelationItemsSchema,
  controlAnalytics: FtsFunctionDetailsRelationItemsSchema,
});

export const FtsFunctionDetailsRelationResponseSchema = BaseResponseSchema.extend({
  data: FtsFunctionDetailsRelationSchema,
})

export class FtsFunctionDetailItemsDto extends createZodDto(FtsFunctionDetailItemsSchema) { }
export class FtsFunctionDetailBaseDto extends createZodDto(FtsFunctionDetailBaseSchema) { }
export class FtsFunctionDetailItemsResponseDto extends createZodDto(FtsFunctionDetailItemsResponseSchema) { }
export class FtsFunctionDetailBaseResponseDto extends createZodDto(FtsFunctionDetailBaseResponseSchema) { }
export class FtsFunctionDetailPreviewDto extends createZodDto(FtsFunctionDetailPreviewSchema) { }
export class FtsFunctionDetailsRelationDto extends createZodDto(FtsFunctionDetailsRelationSchema) { }
export class FtsFunctionDetailsRelationResponseDto extends createZodDto(FtsFunctionDetailsRelationResponseSchema) { }