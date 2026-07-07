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
  feedbacks: { select: { id: true } },
} as const satisfies Prisma.ActionSelect;

export const ActionsFeedbackSelect = {
  id: true,
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
} as const satisfies Prisma.FeedbackSelect;

export const ActionBaseSelect = {
  id: true,
  status: { select: TypeSelect },
  priorityAction: { select: TypeSelect },
  characterAction: { select: TypeSelect },
  personPerformingAction: { select: TypeSelect },
  otherPersonPerformingAction: true,
  description: true,
  feedbacks: {
    where: { isDeleted: false },
    select: ActionsFeedbackSelect,
    orderBy: [{ order: 'asc' }, { id: 'desc' }],
  },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ActionSelect;
