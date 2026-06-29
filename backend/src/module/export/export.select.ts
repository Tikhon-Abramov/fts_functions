import { Prisma } from "src/generated/prisma/client";
import { TypeSelect, UserSelect } from "../constant/constant.select";

export const feedbackSelect = {
  id: true,
  ftsFunctionDetailId: true,
  feedbackQualityMetricsId: true,
  problemDescription: true,
  initiatorRequisites: true,
  ftsMethodologyStatusId: true,
  deadline: true,
  initiatorAcceptance: true,
  acceptStatus: {
    select: TypeSelect,
  },
  ftsMethodologyStatus: {
    select: TypeSelect,
  },
  feedbackQualityMetrics: {
    select: TypeSelect,
  },
  feedbackSources: {
    select: {
      type: {
        select: TypeSelect,
      },
    },
  },
} as const satisfies Prisma.FeedbackSelect;

export const actionSelect = {
  id: true,
  ftsFunctionDetailId: true,
  statusId: true,
  description: true,
  feedbackQualityMetricsId: true,
  ftsMethodologyStatusId: true,
  problemDescription: true,
  initiatorRequisites: true,
  deadline: true,
  initiatorAcceptance: true,
  status: { select: TypeSelect },
  feedbackQualityMetrics: { select: TypeSelect },
  feedbackSources: {
    select: {
      type: {
        select: TypeSelect,
      },
    },
  },
} as const satisfies Prisma.ActionSelect;

export const ftsFunctionDetailDetailedSelect = {
  id: true,
  ftsFunctionId: true,
  ftsFunctionStepId: true,
  ftsFunctionCategoryId: true,
  ftsFunctionComplexityId: true,
  ftsFunctionExecutionFrequencyId: true,
  whoPerformsActionId: true,
  ftsFunctionActionTypeId: true,
  ftsFunctionEffectivenessId: true,
  technologicalSolutionId: true,
  responsibleId: true,
  ftsFunctionDetails: true,
  basis: true,
  actionsСompleteness: true,
  actionsEffectiveness: true,
  artifact: true,
  artifactUsage: true,
  purpose: true,
  number: true,
  algorithm: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  ftsFunctionStep: {
    select: TypeSelect,
  },
  ftsFunctionCategory: {
    select: TypeSelect,
  },
  ftsFunctionComplexity: {
    select: TypeSelect,
  },
  ftsFunctionExecutionFrequency: {
    select: TypeSelect,
  },
  whoPerformsAction: {
    select: TypeSelect,
  },
  ftsFunctionActionType: {
    select: TypeSelect,
  },
  ftsFunctionEffectiveness: {
    select: TypeSelect,
  },
  technologicalSolution: {
    select: TypeSelect,
  },
  responsible: {
    select: TypeSelect,
  },
  feedbacks: {
    select: feedbackSelect,
    where: {
      isDeleted: false,
    },
  },
  actions: {
    select: actionSelect,
    where: {
      isDeleted: false,
    },
  },
} as const satisfies Prisma.FtsFunctionDetailSelect;

export const downloadFtsFunctionSelect = {
  id: true,
  ftsCentralization: {
    select: TypeSelect,
  },
  ftsFunctionName: {
    select: TypeSelect,
  },
  competencyCenter: {
    select: TypeSelect,
  },
  ftsFunctionMarker: {
    select: TypeSelect,
  },
  curatorCentralOffice: {
    select: UserSelect,
  },
  managerInterregionalInspection: {
    select: UserSelect,
  },
  departmentHeadCentralOffice: {
    select: UserSelect,
  },
  departmentHeadInterregionalInspection: {
    select: UserSelect,
  },
  createdAt: true,
  updatedAt: true,
  dtis: {
    select: {
      type: {
        select: TypeSelect,
      },
    },
  },
} as const satisfies Prisma.FtsFunctionSelect;

export const downloadFtsFunctionDetailSelect = {
  ...ftsFunctionDetailDetailedSelect,
  feedbacks: undefined,
  ftsFunction: {
    select: {
      ftsFunctionName: {
        select: TypeSelect,
      },
    },
  },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FtsFunctionDetailSelect;

export const downloadFeedbackSelect = {
  ...feedbackSelect,
  ftsFunctionDetail: {
    select: {
      id: true,
      ftsFunction: {
        select: {
          id: true,
          ftsFunctionName: {
            select: TypeSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
} as const satisfies Prisma.FeedbackSelect;

export const downloadFtsFunctionTreeSelect = {
  parentFtsFunction: {
    select: {
      id: true,
      ftsFunction: {
        select: {
          id: true,
          ftsFunctionName: {
            select: TypeSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
  childFtsFunction: {
    select: {
      id: true,
      ftsFunction: {
        select: {
          id: true,
          ftsFunctionName: {
            select: TypeSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
  relationType: {
    select: TypeSelect,
  },
  createdAt: true,
} as const satisfies Prisma.FtsFunctionTreeSelect;

export const downloadActionSelect = {
  id: true,
  ftsFunctionDetailId: true,
  statusId: true,
  ftsFunctionDetail: {
    select: {
      id: true,
      ftsFunction: {
        select: {
          id: true,
          ftsFunctionName: {
            select: TypeSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
  description: true,
  ftsMethodologyStatusId: true,
  problemDescription: true,
  initiatorRequisites: true,
  initiatorAcceptance: true,
  deadline: true,
  status: { select: TypeSelect },
  feedbackQualityMetrics: { select: TypeSelect },
  feedbackSources: {
    select: {
      type: {
        select: TypeSelect,
      },
    },
  },
} as const satisfies Prisma.ActionSelect;
