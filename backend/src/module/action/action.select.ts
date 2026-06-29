import { Prisma } from 'src/generated/prisma/client';
import { TypeSelect } from '../constant/constant.select';


export const GeneralInfoActionsSelect = {
  actionsInput: true,
  actionsOutput: true,
} as const satisfies Prisma.FtsFunctionDetailSelect;

export const ActionPreviewSelect = {
  id: true,
  status: { select: TypeSelect },
  priorityAction: { select: TypeSelect },
  description: true,
  feedbackQualityMetricsId: true,
} as const satisfies Prisma.ActionSelect;

export const ActionBaseSelect = {
  id: true,
  status: { select: TypeSelect },
  priorityAction: { select: TypeSelect },
  description: true,
  feedbackQualityMetrics: { select: TypeSelect },
  ftsMethodologyStatus: { select: TypeSelect },
  problemDescription: true,
  initiatorRequisites: true,
  initiatorAcceptance: true,
  feedbackSources: {
    select: {
      type: { select: TypeSelect },
    },
  },
  deadline: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ActionSelect;
