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

// List variant: base shape + minimal DTI projection so the registry table can
// render the "Стратегия Д" column without an extra round-trip per row. Kept
// separate from `ftsFunctionBaseSelect` because most write paths return the
// base shape and pulling the join would be wasted bytes there.
export const ftsFunctionListSelect = {
  ...ftsFunctionBaseSelect,
  dtis: {
    select: {
      dti: { select: { id: true, name: true, code: true } },
    },
  },
} as const satisfies Prisma.FtsFunctionSelect;

export const ftsFunctionDetailBaseSelect = {
  id: true,
  ftsFunctionId: true,
  ftsFunctionStepId: true,
  ftsFunctionCategoryId: true,
  ftsFunctionComplexityId: true,
  ftsFunctionExecutionFrequencyId: true,
  whoPerformsActionId: true,
  ftsFunctionActionTypeId: true,
  ftsFunctionEffectivenessId: true,
  ftsFunctionDetails: true,
  technologicalSolutionId: true,
  feedbackSourceId: true,
  responsibleId: true,
  ftsMethodologyStatusId: true,
  basis: true,
  artifact: true,
  artifactUsage: true,
  purpose: true,
  number: true,
  algorithm: true,
  problemDescription: true,
  initiatorRequisites: true,
  deadline: true,
  isAccepted: true,
  rejectComment: true,
  createdAt: true,
  updatedAt: true,
  isDeleted: true,
  deletedAt: true,
} as const satisfies Prisma.FtsFunctionDetailSelect;

export const ftsFunctionDetailedSelect = {
  ...ftsFunctionBaseSelect,
  ftsCentralization: { select: typeMinimalSelect },
  ftsFunctionName: { select: typeMinimalSelect },
  competencyCenter: { select: typeMinimalSelect },
  ftsFunctionMarker: { select: typeMinimalSelect },
  curatorCentralOffice: { select: userMinimalSelect },
  managerInterregionalInspection: { select: userMinimalSelect },
  departmentHeadCentralOffice: { select: userMinimalSelect },
  departmentHeadInterregionalInspection: { select: userMinimalSelect },
  dtis: {
    select: {
      dtiId: true,
      createdAt: true,
      dti: { select: typeMinimalSelect },
    },
  },
  ftsFunctionDetails: {
    where: { isDeleted: false },
    orderBy: { createdAt: 'asc' },
    select: {
      ...ftsFunctionDetailBaseSelect,
      ftsFunctionStep: { select: typeMinimalSelect },
      ftsFunctionCategory: { select: typeMinimalSelect },
      ftsFunctionComplexity: { select: typeMinimalSelect },
      ftsFunctionExecutionFrequency: { select: typeMinimalSelect },
      whoPerformsAction: { select: typeMinimalSelect },
      ftsFunctionActionType: { select: typeMinimalSelect },
      ftsFunctionEffectiveness: { select: typeMinimalSelect },
      technologicalSolution: { select: typeMinimalSelect },
      feedbackSource: { select: typeMinimalSelect },
      responsible: { select: typeMinimalSelect },
      ftsMethodologyStatus: { select: typeMinimalSelect },

      parents: {
        select: {
          parentFtsFunctionId: true,
          childFtsFunctionId: true,
          relationTypeId: true,
          createdAt: true,
          relationType: { select: typeMinimalSelect },
        },
      },
      children: {
        select: {
          parentFtsFunctionId: true,
          childFtsFunctionId: true,
          relationTypeId: true,
          createdAt: true,
          relationType: { select: typeMinimalSelect },
        },
      },
    },
  },
} as const satisfies Prisma.FtsFunctionSelect;

export const ftsFunctionDetailDetailedSelect = {
  ...ftsFunctionDetailBaseSelect,
  ftsFunctionStep: { select: typeMinimalSelect },
  ftsFunctionCategory: { select: typeMinimalSelect },
  ftsFunctionComplexity: { select: typeMinimalSelect },
  ftsFunctionExecutionFrequency: { select: typeMinimalSelect },
  whoPerformsAction: { select: typeMinimalSelect },
  ftsFunctionActionType: { select: typeMinimalSelect },
  ftsFunctionEffectiveness: { select: typeMinimalSelect },
  technologicalSolution: { select: typeMinimalSelect },
  feedbackSource: { select: typeMinimalSelect },
  responsible: { select: typeMinimalSelect },
  ftsMethodologyStatus: { select: typeMinimalSelect },
} as const satisfies Prisma.FtsFunctionDetailSelect;

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
