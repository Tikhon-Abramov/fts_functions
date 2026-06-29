import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { BaseResponseSchema, positiveInt, dateFromJson } from '@common/schemas';
import { TypeResponseSchema } from '../constant/constant.schema';



////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// QUERY /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const ActionQuerySchema = z.object({
  ftsFunctionDetailId: positiveInt,
});

export class ActionQueryDto extends createZodDto(ActionQuerySchema) { }


////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////// BODY (create / update) ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const UpdateGeneralInfoActionsSchema = z.object({
  actionsInput: z.string(),
  actionsOutput: z.string(),
});

export const CreateActionSchema = z.object({
  ftsFunctionDetailId: positiveInt,
  statusId: positiveInt,
  priorityActionId: positiveInt,
  description: z.string(),
});

export const CreateActionsFeedbackSchema = z.object({
  feedbackQualityMetricsId: positiveInt,
  ftsMethodologyStatusId: positiveInt,
  priorityActionId: positiveInt,
  problemDescription: z.string(),
  initiatorRequisites: z.string(),
  initiatorAcceptance: z.string(),
  feedbackSourceIds: z.array(positiveInt),
  deadline: z
    .union([z.string().datetime(), z.date()])
    .transform(val => val ? new Date(val) : undefined),
});

export const UpdateActionSchema = CreateActionSchema.partial();
export const UpdateActionsFeedbackSchema = CreateActionsFeedbackSchema.partial();

export const ReorderActionsSchema = z.object({
  orderedIds: z.array(positiveInt),
});

export class CreateActionDto extends createZodDto(CreateActionSchema) { }
export class UpdateActionDto extends createZodDto(UpdateActionSchema) { }

export class CreateActionsFeedbackDto extends createZodDto(CreateActionsFeedbackSchema) { }
export class UpdateActionsFeedbackDto extends createZodDto(UpdateActionsFeedbackSchema) { }
export class UpdateGeneralInfoActionsDto extends createZodDto(UpdateGeneralInfoActionsSchema) { }

export class ReorderActionsDto extends createZodDto(ReorderActionsSchema) { }

////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// RESPONSE ///////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

export const GeneralInfoActionsSchema = z.object({
  actionsInput: z.string().nullable(),
  actionsOutput: z.string().nullable(),
});

export const ActionPreviewSchema = z.object({
  id: positiveInt,
  status: TypeResponseSchema,
  priorityAction: TypeResponseSchema.nullable(),
  description: z.string(),
  feedbackQualityMetricsId: positiveInt.nullable(),
});

export const ActionBaseSchema = z.object({
  id: positiveInt,
  status: TypeResponseSchema,
  priorityAction: TypeResponseSchema.nullable(),
  description: z.string(),
  feedbackQualityMetrics: TypeResponseSchema.nullable(),
  ftsMethodologyStatus: TypeResponseSchema.nullable(),
  problemDescription: z.string().nullable(),
  initiatorRequisites: z.string().nullable(),
  initiatorAcceptance: z.string().nullable(),
  feedbackSources: z.array(
    z.object({ type: TypeResponseSchema })
  ),
  deadline: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GeneralInfoActionsResponseSchema = BaseResponseSchema.extend({
  data: GeneralInfoActionsSchema,
});

export const ActionItemsSchema = z.array(ActionPreviewSchema);

export const ActionItemsResponseSchema = BaseResponseSchema.extend({
  data: ActionItemsSchema,
});

export const ActionBaseResponseSchema = BaseResponseSchema.extend({
  data: ActionBaseSchema,
});

export class GeneralInfoActionsDto extends createZodDto(GeneralInfoActionsSchema) { }
export class ActionItemsDto extends createZodDto(ActionItemsSchema) { }
export class ActionBaseDto extends createZodDto(ActionBaseSchema) { }
export class GeneralInfoActionsResponseDto extends createZodDto(GeneralInfoActionsResponseSchema) { }
export class ActionItemsResponseDto extends createZodDto(ActionItemsResponseSchema) { }
export class ActionBaseResponseDto extends createZodDto(ActionBaseResponseSchema) { }
