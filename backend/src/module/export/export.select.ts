import { Prisma } from "src/generated/prisma/client";
import { TypeSelect, UserSelect } from "../constant/constant.select";



export const downloadFtsFunctionSelect = {
  id: true,
  ftsCentralization: {
    select: TypeSelect,
  },
  ftsFunctionName: {
    select: TypeSelect,
  },
  otherFtsFunctionName: true,
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
  dtis: {
    select: {
      type: {
        select: TypeSelect,
      },
    },
  },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FtsFunctionSelect;

export const downloadFtsFunctionDetailSelect = {
  id: true,
  ftsFunctionId: true,
  ftsFunction: {
    select: {
      ftsFunctionName: {
        select: TypeSelect,
      },
      otherFtsFunctionName: true,
      competencyCenter: {
        select: TypeSelect,
      },
    },
  },
  ftsFunctionDetails: true,
  basis: true,
  actionsСompleteness: true,
  actionsEffectiveness: true,
  otherPersonPerformingAction: true,
  artifact: true,
  artifactUsage: true,
  purpose: true,
  number: true,
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
  personPerformingAction: {
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
} as const satisfies Prisma.FtsFunctionDetailSelect;

export const downloadFeedbackSelect = {
  ftsFunctionDetail: {
    select: {
      id: true,
      ftsFunction: {
        select: {
          id: true,
          ftsFunctionName: {
            select: TypeSelect,
          },
          otherFtsFunctionName: true,
          competencyCenter: {
            select: TypeSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
  id: true,
  problemDescription: true,
  initiatorRequisites: true,
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
          otherFtsFunctionName: true,
          competencyCenter: {
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
          otherFtsFunctionName: true,
          competencyCenter: {
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
  ftsFunctionDetail: {
    select: {
      id: true,
      ftsFunction: {
        select: {
          id: true,
          ftsFunctionName: {
            select: TypeSelect,
          },
          otherFtsFunctionName: true,
          competencyCenter: {
            select: TypeSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
  status: { select: TypeSelect },
  description: true,
  priorityAction: { select: TypeSelect },
  characterAction: { select: TypeSelect },
  personPerformingAction: { select: TypeSelect },
  otherPersonPerformingAction: true,

  feedbacks: {
    where: { isDeleted: false },
    select: {
      ftsMethodologyStatus: { select: TypeSelect },
      feedbackQualityMetrics: { select: TypeSelect },
      problemDescription: true,
      initiatorRequisites: true,
      initiatorAcceptance: true,
      deadline: true,
      feedbackSources: {
        select: {
          type: {
            select: TypeSelect,
          },
        },
      },
    },
  },
} as const satisfies Prisma.ActionSelect;
