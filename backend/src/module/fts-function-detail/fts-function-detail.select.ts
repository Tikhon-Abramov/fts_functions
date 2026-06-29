import { Prisma } from 'src/generated/prisma/client';
import { TypeSelect } from '../constant/constant.select';


export const FtsFunctionDetailPreviewSelect = {
  id: true,
  ftsFunctionDetails: true,
  ftsFunctionStep: { select: TypeSelect },
  ftsFunctionCategory: { select: TypeSelect },
  whoPerformsAction: { select: TypeSelect },
  feedbacks: {
    where: { isDeleted: false },
    select: { acceptStatus: { select: TypeSelect } }
  },
  parents: { select: { parentFtsFunctionId: true } },
  children: { select: { childFtsFunctionId: true } },
} as const satisfies Prisma.FtsFunctionDetailSelect;

export const FtsFunctionDetailBaseSelect = {
  id: true,
  ftsFunctionId: true,
  ftsFunctionStep: { select: TypeSelect },
  ftsFunctionCategory: { select: TypeSelect },
  ftsFunctionComplexity: { select: TypeSelect },
  ftsFunctionExecutionFrequency: { select: TypeSelect },
  whoPerformsAction: { select: TypeSelect },
  technologicalSolution: { select: TypeSelect },
  responsible: { select: TypeSelect },
  ftsFunctionDetails: true,
  actionsСompleteness: true,
  actionsEffectiveness: true,
  basis: true,
  artifact: true,
  artifactUsage: true,
  number: true,
  algorithm: true,
  createdAt: true,
  updatedAt: true,

  algorithmFiles: {
    where: {
      isDeleted: false,
      isUploadConfirmed: true,
    },
    select: {
      id: true,
      objectKey: true,
      originalName: true,
      mimeType: true,
      size: true,
    },
  }
} as const satisfies Prisma.FtsFunctionDetailSelect;

export const getFtsFunctionDetailRelationsSelect = (targetId: number) => ({
  ...FtsFunctionDetailPreviewSelect,
  parents: {
    where: { parentFtsFunctionId: targetId },
    select: { relationType: { select: TypeSelect } }
  },
  children: {
    where: { childFtsFunctionId: targetId },
    select: { relationType: { select: TypeSelect } }
  },
} as const satisfies Prisma.FtsFunctionDetailSelect);
