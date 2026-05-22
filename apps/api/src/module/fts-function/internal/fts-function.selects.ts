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
  ftsMethodologyStatusId: true,
  ftsFunctionDetails: true,
  basis: true,
  artifact: true,
  artifactUsage: true,
  purpose: true,
  number: true,
  algorithm: true,
  problemDescription: true,
  initiatorRequisites: true,
  methodologyPosition: true,
  initiatorAcceptance: true,
  deadline: true,
  isAccepted: true,
  rejectComment: true,
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
  ftsMethodologyStatus: {
    select: typeMinimalSelect,
  },
  feedbackSources: {
    select: {
      feedbackSource: {
        select: typeMinimalSelect,
      },
    },
  },
} as const satisfies Prisma.FtsFunctionDetailSelect;

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