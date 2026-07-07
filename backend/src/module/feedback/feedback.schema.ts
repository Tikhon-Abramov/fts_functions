import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { BaseResponseSchema, positiveInt, dateFromJson } from '@common/schemas';
import { TypeResponseSchema } from '../constant/constant.schema';



////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// QUERY /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const FeedbackQuerySchema = z.object({
  ftsFunctionDetailId: positiveInt,
});

export class FeedbackQueryDto extends createZodDto(FeedbackQuerySchema) { }


////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// BODY (create / update) ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const CreateFeedbackSchema = z.object({
  ftsFunctionDetailId: positiveInt,
  feedbackQualityMetricsId: positiveInt,
  ftsMethodologyStatusId: positiveInt,
  problemDescription: z.string(),
  initiatorRequisites: z.string(),
  initiatorAcceptance: z.string(),
  feedbackSourceIds: z.array(positiveInt),
  deadline: z
    .union([z.string().datetime(), z.date()])
    .transform(val => val ? new Date(val) : undefined),
});

export const UpdateFeedbackSchema = CreateFeedbackSchema.partial();

export const AcceptFeedbackSchema = z.object({
  acceptStatusId: positiveInt,
  comment: z.string().optional(),
});

export const ReorderFeedbacksSchema = z.object({
  orderedIds: z.array(positiveInt),
});

export class CreateFeedbackDto extends createZodDto(CreateFeedbackSchema) { }
export class UpdateFeedbackDto extends createZodDto(UpdateFeedbackSchema) { }

export class AcceptFeedbackDto extends createZodDto(AcceptFeedbackSchema) { }

export class ReorderFeedbacksDto extends createZodDto(ReorderFeedbacksSchema) {}


////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// RESPONSE ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const FeedbackPreviewSchema = z.object({
  id: positiveInt,
  problemDescription: z.string().nullable(),
  feedbackQualityMetrics: TypeResponseSchema.nullable(),
  initiatorAcceptance: z.string().nullable(),
  acceptStatus: TypeResponseSchema.nullable(),
  deadline: z.date().nullable(),
});

export const FeedbackBaseSchema = z.object({
  id: positiveInt,
  feedbackQualityMetrics: TypeResponseSchema.nullable(),
  ftsMethodologyStatus: TypeResponseSchema.nullable(),
  acceptStatus: TypeResponseSchema.nullable(),
  problemDescription: z.string().nullable(),
  initiatorRequisites: z.string().nullable(),
  initiatorAcceptance: z.string().nullable(),
  feedbackSources: z.array(
    z.object({ type: TypeResponseSchema })
  ),
  deadline: z.date().nullable(),
  acceptedAt: z.date().nullable(),
  agreementHistory: z.array(
    z.object({
      acceptStatus: TypeResponseSchema,
      comment: z.string().nullable(),
      createdAt: z.date(),
    })
  ),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const FeedbackItemsSchema = z.array(FeedbackPreviewSchema);

export const FeedbackItemsResponseSchema = BaseResponseSchema.extend({
  data: FeedbackItemsSchema,
});

export const FeedbackBaseResponseSchema = BaseResponseSchema.extend({
  data: FeedbackBaseSchema,
});

export class FeedbackItemsDto extends createZodDto(FeedbackItemsSchema) { }
export class FeedbackBaseDto extends createZodDto(FeedbackBaseSchema) { }
export class FeedbackItemsResponseDto extends createZodDto(FeedbackItemsResponseSchema) { }
export class FeedbackBaseResponseDto extends createZodDto(FeedbackBaseResponseSchema) { }
