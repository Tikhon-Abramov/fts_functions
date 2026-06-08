import type { Prisma } from '@prisma-client';

export const userMinimalSelect = {
  id: true,
  shortName: true,
  fullName: true,
} as const satisfies Prisma.UserSelect;

export const typeMinimalSelect = {
  id: true,
  code: true,
  name: true,
  category: true,
} as const satisfies Prisma.TypeSelect;

export const ftsFunctionBaseSelect = {
  id: true,
  ftsCentralizationId: true,
  ftsFunctionNameId: true,
  competencyCenterId: true,
  ftsFunctionMarkerId: true,
  curatorCentralOfficeId: true,
  managerInterregionalInspectionId: true,
  departmentHeadCentralOfficeId: true,
  departmentHeadInterregionalInspectionId: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
} as const satisfies Prisma.FtsFunctionSelect;

export const ftsFunctionListSelect = {
  ...ftsFunctionBaseSelect,
  dtis: {
    select: {
      dti: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
} as const satisfies Prisma.FtsFunctionSelect;

export const ftsFunctionTreeSelect = {
  parentFtsFunctionId: true,
  childFtsFunctionId: true,
  relationTypeId: true,
  createdAt: true,
} as const satisfies Prisma.FtsFunctionTreeSelect;

export const ftsFunctionToDtiSelect = {
  ftsFunctionId: true,
  dtiId: true,
  createdAt: true,
} as const satisfies Prisma.FtsFunctionToDtiSelect;

export const feedbackSelect = {
  id: true,
  ftsFunctionDetailId: true,
  feedbackQualityMetricsId: true,
  problemDescription: true,
  initiatorRequisites: true,
  ftsMethodologyStatusId: true,
  deadline: true,
  initiatorAcceptance: true,
  isAccepted: true,
  ftsMethodologyStatus: {
    select: typeMinimalSelect,
  },
  feedbackQualityMetrics: {
    select: typeMinimalSelect,
  },
  feedbackSources: {
    select: {
      feedbackSource: {
        select: typeMinimalSelect,
      },
    },
  },
  feedbackAgreementHistory: {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: {
      id: true,
      feedbackId: true,
      fromStatus: true,
      toStatus: true,
      comment: true,
      createdAt: true,
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
  status: { select: typeMinimalSelect },
  feedbackQualityMetrics: { select: typeMinimalSelect },
  feedbackSources: {
    select: {
      feedbackSource: {
        select: typeMinimalSelect,
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
  filePath: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
  ftsFunctionStep: {
    select: typeMinimalSelect,
  },
  ftsFunctionCategory: {
    select: typeMinimalSelect,
  },
  ftsFunctionComplexity: {
    select: typeMinimalSelect,
  },
  ftsFunctionExecutionFrequency: {
    select: typeMinimalSelect,
  },
  whoPerformsAction: {
    select: typeMinimalSelect,
  },
  ftsFunctionActionType: {
    select: typeMinimalSelect,
  },
  ftsFunctionEffectiveness: {
    select: typeMinimalSelect,
  },
  technologicalSolution: {
    select: typeMinimalSelect,
  },
  responsible: {
    select: typeMinimalSelect,
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

const { actions: _actionsForSeparateLoading, ...ftsFunctionDetailDetailedWithoutActionsFields } =
  ftsFunctionDetailDetailedSelect;

export const ftsFunctionDetailedWithoutActionsSelect = {
  ...ftsFunctionBaseSelect,
  ftsCentralization: {
    select: typeMinimalSelect,
  },
  ftsFunctionName: {
    select: typeMinimalSelect,
  },
  competencyCenter: {
    select: typeMinimalSelect,
  },
  ftsFunctionMarker: {
    select: typeMinimalSelect,
  },
  curatorCentralOffice: {
    select: userMinimalSelect,
  },
  managerInterregionalInspection: {
    select: userMinimalSelect,
  },
  departmentHeadCentralOffice: {
    select: userMinimalSelect,
  },
  departmentHeadInterregionalInspection: {
    select: userMinimalSelect,
  },
  dtis: {
    select: {
      dtiId: true,
      createdAt: true,
      dti: {
        select: typeMinimalSelect,
      },
    },
  },
  ftsFunctionDetails: {
    where: {
      isDeleted: false,
    },
    select: {
      ...ftsFunctionDetailDetailedWithoutActionsFields,
      parents: {
        select: {
          parentFtsFunctionId: true,
          childFtsFunctionId: true,
          relationTypeId: true,
          createdAt: true,
          relationType: {
            select: typeMinimalSelect,
          },
        },
      },
      children: {
        select: {
          parentFtsFunctionId: true,
          childFtsFunctionId: true,
          relationTypeId: true,
          createdAt: true,
          relationType: {
            select: typeMinimalSelect,
          },
        },
      },
    },
  },
} as const satisfies Prisma.FtsFunctionSelect;

export const ftsFunctionDetailedSelect = {
  ...ftsFunctionBaseSelect,
  ftsCentralization: {
    select: typeMinimalSelect,
  },
  ftsFunctionName: {
    select: typeMinimalSelect,
  },
  competencyCenter: {
    select: typeMinimalSelect,
  },
  ftsFunctionMarker: {
    select: typeMinimalSelect,
  },
  curatorCentralOffice: {
    select: userMinimalSelect,
  },
  managerInterregionalInspection: {
    select: userMinimalSelect,
  },
  departmentHeadCentralOffice: {
    select: userMinimalSelect,
  },
  departmentHeadInterregionalInspection: {
    select: userMinimalSelect,
  },
  dtis: {
    select: {
      dtiId: true,
      createdAt: true,
      dti: {
        select: typeMinimalSelect,
      },
    },
  },
  ftsFunctionDetails: {
    where: {
      isDeleted: false,
    },
    select: {
      ...ftsFunctionDetailDetailedSelect,
      parents: {
        select: {
          parentFtsFunctionId: true,
          childFtsFunctionId: true,
          relationTypeId: true,
          createdAt: true,
          relationType: {
            select: typeMinimalSelect,
          },
        },
      },
      children: {
        select: {
          parentFtsFunctionId: true,
          childFtsFunctionId: true,
          relationTypeId: true,
          createdAt: true,
          relationType: {
            select: typeMinimalSelect,
          },
        },
      },
    },
  },
} as const satisfies Prisma.FtsFunctionSelect;

export const feedbackDetailedSelect = {
  id: true,
  ftsFunctionDetailId: true,
  feedbackQualityMetricsId: true,
  ftsMethodologyStatusId: true,
  problemDescription: true,
  initiatorRequisites: true,
  initiatorAcceptance: true,
  deadline: true,
  isAccepted: true,
  feedbackQualityMetrics: {
    select: typeMinimalSelect,
  },
  ftsMethodologyStatus: {
    select: typeMinimalSelect,
  },
  feedbackSources: {
    select: {
      feedbackSourceId: true,
      createdAt: true,
      feedbackSource: {
        select: typeMinimalSelect,
      },
    },
  },
  feedbackAgreementHistory: {
    select: {
      id: true,
      feedbackId: true,
      fromStatus: true,
      toStatus: true,
      comment: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.FeedbackSelect;

export const downloadFtsFunctionSelect = {
  id: true,
  ftsCentralization: {
    select: typeMinimalSelect,
  },
  ftsFunctionName: {
    select: typeMinimalSelect,
  },
  competencyCenter: {
    select: typeMinimalSelect,
  },
  ftsFunctionMarker: {
    select: typeMinimalSelect,
  },
  curatorCentralOffice: {
    select: userMinimalSelect,
  },
  managerInterregionalInspection: {
    select: userMinimalSelect,
  },
  departmentHeadCentralOffice: {
    select: userMinimalSelect,
  },
  departmentHeadInterregionalInspection: {
    select: userMinimalSelect,
  },
  createdAt: true,
  updatedAt: true,
  dtis: {
    select: {
      dti: {
        select: typeMinimalSelect,
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
        select: typeMinimalSelect,
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
            select: typeMinimalSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
  feedbackAgreementHistory: undefined,
} as const satisfies Prisma.FeedbackSelect;

export const downloadFtsFunctionTreeSelect = {
  parentFtsFunction: {
    select: {
      id: true,
      ftsFunction: {
        select: {
          id: true,
          ftsFunctionName: {
            select: typeMinimalSelect,
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
            select: typeMinimalSelect,
          },
        },
      },
      ftsFunctionDetails: true,
    },
  },
  relationType: {
    select: typeMinimalSelect,
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
            select: typeMinimalSelect,
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
  status: { select: typeMinimalSelect },
  feedbackQualityMetrics: { select: typeMinimalSelect },
  feedbackSources: {
    select: {
      feedbackSource: {
        select: typeMinimalSelect,
      },
    },
  },
} as const satisfies Prisma.ActionSelect;
