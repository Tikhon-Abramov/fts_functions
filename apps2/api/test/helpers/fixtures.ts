/**
 * Fixture lookup helpers — pick real IDs from the seeded e2e DB so tests don't
 * hard-code integers that would drift as the seed changes.
 */
import type { PrismaService } from '../../src/module/prisma/prisma.service';

export type Prisma = PrismaService;

export async function pickType(
  prisma: Prisma,
  category: string,
): Promise<{ id: number; code: string }> {
  const row = await prisma.type.findFirst({
    where: { category: category as never },
    select: { id: true, code: true },
  });
  if (!row) throw new Error(`No Type rows with category=${category}`);
  return row;
}

export async function pickTypeOfOtherCategory(
  prisma: Prisma,
  excludedCategory: string,
): Promise<{ id: number; category: string }> {
  const row = await prisma.type.findFirst({
    where: { category: { not: excludedCategory as never } },
    select: { id: true, category: true },
  });
  if (!row) throw new Error(`No Type rows with category != ${excludedCategory}`);
  return row;
}

export async function pickUser(
  prisma: Prisma,
  where: {
    ftsBranchType: 'CENTRAL_OFFICE' | 'INTERREGIONAL_INSPECTION';
    ftsFunctionRole?: 'CURATOR' | 'MANAGER' | null;
    ftsPositionRoleNotNull?: boolean;
  },
): Promise<{ id: number }> {
  const prismaWhere: Record<string, unknown> = {
    isDeleted: false,
    ftsBranchType: where.ftsBranchType,
  };
  if (where.ftsFunctionRole !== undefined) {
    prismaWhere['ftsFunctionRole'] = where.ftsFunctionRole;
  }
  if (where.ftsPositionRoleNotNull) {
    prismaWhere['ftsPositionRole'] = { not: null };
  }

  const user = await prisma.user.findFirst({
    where: prismaWhere as never,
    select: { id: true },
  });
  if (!user) throw new Error(`No user found for ${JSON.stringify(where)}`);
  return user;
}

export type CreateFtsFunctionIds = {
  ftsCentralizationId: number;
  ftsFunctionNameId: number;
  competencyCenterId: number;
  ftsFunctionMarkerId: number;
  curatorCentralOfficeId: number;
  managerInterregionalInspectionId: number;
  departmentHeadCentralOfficeId: number;
  departmentHeadInterregionalInspectionId: number;
};

export async function resolveCreateFtsFunctionIds(prisma: Prisma): Promise<CreateFtsFunctionIds> {
  const [
    ftsCentralization,
    ftsFunctionName,
    competencyCenter,
    ftsFunctionMarker,
    curatorCentralOffice,
    managerInterregionalInspection,
    departmentHeadCentralOffice,
    departmentHeadInterregionalInspection,
  ] = await Promise.all([
    pickType(prisma, 'FTS_CENTRALIZATION'),
    pickType(prisma, 'FTS_FUNCTION_NAME'),
    pickType(prisma, 'FTS_COMPETENCY_CENTER'),
    pickType(prisma, 'FTS_FUNCTION_MARKER'),
    pickUser(prisma, {
      ftsBranchType: 'CENTRAL_OFFICE',
      ftsFunctionRole: 'CURATOR',
    }),
    pickUser(prisma, {
      ftsBranchType: 'INTERREGIONAL_INSPECTION',
      ftsFunctionRole: 'MANAGER',
    }),
    pickUser(prisma, {
      ftsBranchType: 'CENTRAL_OFFICE',
      ftsPositionRoleNotNull: true,
    }),
    pickUser(prisma, {
      ftsBranchType: 'INTERREGIONAL_INSPECTION',
      ftsPositionRoleNotNull: true,
    }),
  ]);

  return {
    ftsCentralizationId: ftsCentralization.id,
    ftsFunctionNameId: ftsFunctionName.id,
    competencyCenterId: competencyCenter.id,
    ftsFunctionMarkerId: ftsFunctionMarker.id,
    curatorCentralOfficeId: curatorCentralOffice.id,
    managerInterregionalInspectionId: managerInterregionalInspection.id,
    departmentHeadCentralOfficeId: departmentHeadCentralOffice.id,
    departmentHeadInterregionalInspectionId: departmentHeadInterregionalInspection.id,
  };
}

export type CreateFtsFunctionDetailIds = {
  ftsFunctionStepId: number;
  ftsFunctionCategoryId: number;
  ftsFunctionComplexityId: number;
  ftsFunctionExecutionFrequencyId: number;
  ftsFunctionActionTypeId: number;
};

export async function resolveCreateFtsFunctionDetailIds(
  prisma: Prisma,
): Promise<CreateFtsFunctionDetailIds> {
  const [step, category, complexity, frequency, actionType] = await Promise.all([
    pickType(prisma, 'FTS_FUNCTION_STEP'),
    pickType(prisma, 'FTS_FUNCTION_CATEGORY'),
    pickType(prisma, 'FTS_FUNCTION_COMPLEXITY'),
    pickType(prisma, 'FTS_FUNCTION_EXECUTION_FREQUENCY'),
    pickType(prisma, 'FTS_FUNCTION_ACTION_TYPE'),
  ]);
  return {
    ftsFunctionStepId: step.id,
    ftsFunctionCategoryId: category.id,
    ftsFunctionComplexityId: complexity.id,
    ftsFunctionExecutionFrequencyId: frequency.id,
    ftsFunctionActionTypeId: actionType.id,
  };
}
