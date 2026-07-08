import { Prisma } from "src/generated/prisma/client";
import { TypeSelect, UserSelect } from "../constant/constant.select";

export const feedbackSelect = {
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

// export const actionSelect = {
//   id: true,
//   ftsFunctionDetailId: true,
//   statusId: true,
//   description: true,


//   // feedbackQualityMetricsId: true,
//   // ftsMethodologyStatusId: true,
//   // problemDescription: true,
//   // initiatorRequisites: true,
//   // deadline: true,
//   // initiatorAcceptance: true,
//   // status: { select: TypeSelect },
//   // feedbackQualityMetrics: { select: TypeSelect },
//   // feedbackSources: {
//   //   select: {
//   //     type: {
//   //       select: TypeSelect,
//   //     },
//   //   },
//   // },
// } as const satisfies Prisma.ActionSelect;

export const ftsFunctionDetailDetailedSelect = {
  id: true,
  ftsFunctionId: true,
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
      competencyCenter: {
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
          competencyCenter: {
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
  ftsMethodologyStatusId: true,
  problemDescription: true,
  initiatorRequisites: true,
  initiatorAcceptance: true,
  deadline: true,
  feedbackQualityMetrics: { select: TypeSelect },
  feedbackSources: {
    select: {
      type: {
        select: TypeSelect,
      },
    },
  },
  action: {
    select: {
      ftsFunctionDetail: {
        select: {
          id: true,
          ftsFunction: {
            select: {
              id: true,
              ftsFunctionName: {
                select: TypeSelect,
              },
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
    },
  },
} as const satisfies Prisma.FeedbackSelect;
