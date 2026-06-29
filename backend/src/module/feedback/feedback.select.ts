import { Prisma } from 'src/generated/prisma/client';
import { TypeSelect } from '../constant/constant.select';


export const FeedbackPreviewSelect = {
  id: true,
  problemDescription: true,
  feedbackQualityMetrics: { select: TypeSelect },
  initiatorAcceptance: true,
  acceptStatus: { select: TypeSelect },
  deadline: true,
} as const satisfies Prisma.FeedbackSelect;


export const FeedbackBaseSelect = {
  id: true,
  feedbackQualityMetrics: { select: TypeSelect },
  ftsMethodologyStatus: { select: TypeSelect },
  acceptStatus: { select: TypeSelect },
  problemDescription: true,
  initiatorRequisites: true,
  initiatorAcceptance: true,
  feedbackSources: {
    select: {
      type: { select: TypeSelect },
    },
  },
  deadline: true,
  acceptedAt: true,
  createdAt: true,
  updatedAt: true,
  agreementHistory: {
    select: {
      acceptStatus: { select: TypeSelect },
      comment: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' }
  }
} as const satisfies Prisma.FeedbackSelect;
