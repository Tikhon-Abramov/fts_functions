import process from 'node:process';
import {
  type Category,
  type FtsBranchType,
  type FtsFunctionRole,
  type FtsPositionRole,
  type PrismaClient,
} from 'src/generated/prisma/client';

import {
  ActionLabelMap,
  CategoryMap,
  CentralizationMap,
  CompetenceCenterMap,
  ComplexityMap,
  EfficiencyMap,
  LinkKindMap,
  MarkerMap,
  PeriodicityMap,
  WhoMap,
} from '../utils/data.maps';
import { type FunctionRecord, type Row } from '../utils/data.types';
import { readRecords } from '../utils/read-records';
import { TypesCodeEnum } from '../utils/types-code.enum';

type TypeFilter = {
  code?: string;
  name?: string;
};

type UserFilter = {
  ftsPositionRole?: FtsPositionRole | { in: FtsPositionRole[] };
  ftsFunctionRole?: FtsFunctionRole | { in: FtsFunctionRole[] };
  ftsBranchType?: FtsBranchType | { in: FtsBranchType[] };
  fullName: string;
};

async function findType(
  prisma: PrismaClient,
  category: Category,
  filter: TypeFilter,
): Promise<number> {
  const type = await prisma.type.findFirst({
    where: {
      category,
      ...filter,
    },
    select: { id: true },
  });
  if (!type) {
    throw new Error('No type found');
  }
  return type.id;
}

async function findUser(prisma: PrismaClient, filter: UserFilter): Promise<number> {
  const user = await prisma.user.findFirst({
    where: {
      ...filter,
      role: 'USER',
      isDeleted: false,
    },
    select: { id: true },
  });
  if (!user) {
    throw new Error('No user found');
  }
  return user.id;
}

function getStepCode(step: 1 | 2): string {
  return step === 1 ? TypesCodeEnum.OBJECT_SELECTION : TypesCodeEnum.CLUSTERING_IMPACT;
}

async function processRow(prisma: PrismaClient, ftsFunctionId: number, row: Row): Promise<number> {
  // Получаем ID для шага функции
  const stepCode = getStepCode(row.step);
  const stepId = await findType(prisma, 'FTS_FUNCTION_STEP', { code: stepCode });

  let categoryId: number | null = null;
  if (row.category) {
    const categoryCode = CategoryMap[row.category];
    if (categoryCode) {
      categoryId = await findType(prisma, 'FTS_FUNCTION_CATEGORY', {
        code: categoryCode,
      });
    }
  }

  let complexityId: number | null = null;
  if (row.complexity) {
    const complexityCode = ComplexityMap[row.complexity];
    if (complexityCode) {
      complexityId = await findType(prisma, 'FTS_FUNCTION_COMPLEXITY', {
        code: complexityCode,
      });
    }
  }

  let frequencyId: number | null = null;
  if (row.periodicity) {
    const periodicityCode = PeriodicityMap[row.periodicity];
    if (periodicityCode) {
      frequencyId = await findType(prisma, 'FTS_FUNCTION_EXECUTION_FREQUENCY', {
        code: periodicityCode,
      });
    }
  }

  let actionTypeId: number | null = null;
  if (row.actionLabel) {
    const actionLabelCode = ActionLabelMap[row.actionLabel];
    if (actionLabelCode) {
      actionTypeId = await findType(prisma, 'FTS_FUNCTION_ACTION_TYPE', {
        code: actionLabelCode,
      });
    }
  }

  let whoPerformsActionId: number | null = null;
  if (row.who) {
    const whoCode = WhoMap[row.who];
    if (whoCode) {
      whoPerformsActionId = await findType(prisma, 'WHO_PERFORMS_ACTION', {
        code: whoCode,
      });
    }
  }

  let ftsFunctionEffectivenessId: number | null = null;
  if (row.efficiency) {
    const effectivenessCode = EfficiencyMap[row.efficiency];
    if (effectivenessCode) {
      ftsFunctionEffectivenessId = await findType(prisma, 'FTS_FUNCTION_EFFECTIVENESS', {
        code: effectivenessCode,
      });
    }
  }

  const detail = await prisma.ftsFunctionDetail.create({
    data: {
      ftsFunctionId,
      ftsFunctionStepId: stepId,
      ftsFunctionCategoryId: categoryId,
      ftsFunctionComplexityId: complexityId,
      ftsFunctionExecutionFrequencyId: frequencyId,
      ftsFunctionActionTypeId: actionTypeId,
      whoPerformsActionId,
      ftsFunctionDetails: row.detailText,
      ftsFunctionEffectivenessId,
      basis: row.basis || null,
      artifact: row.artifact || null,
      artifactUsage: row.artifactUsage || null,
      purpose: row.purpose || null,
    },
    select: { id: true },
  });

  return detail.id;
}

export async function seedFtsFunctions(prisma: PrismaClient): Promise<void> {
  console.log('Starting seedFtsFunctions...');

  const ftsFunctions = await readRecords<FunctionRecord>(
    `${process.cwd()}/db/seeds/fts-functions/data-1.ts`,
  );

  console.log(`Found ${ftsFunctions.length} functions to process`);

  for (const f of ftsFunctions) {
    console.log(`Processing function: ${f.name}`);

    // Получаем ID для названия функции
    const functionNameId = await findType(prisma, 'FTS_FUNCTION_NAME', { name: f.name });

    // Получаем ID для центра компетенции
    const competenceCenterCode = CompetenceCenterMap[f.competenceCenter];
    if (!competenceCenterCode) {
      throw new Error(`Unknown competenceCenter: ${f.competenceCenter}`);
    }
    const competencyCenterId = await findType(prisma, 'FTS_COMPETENCY_CENTER', {
      code: competenceCenterCode,
    });

    // Получаем ID пользователей
    const curatorId = await findUser(prisma, {
      fullName: f.curatorCA,
      ftsBranchType: 'CENTRAL_OFFICE',
      ftsFunctionRole: 'CURATOR',
    });

    const managerId = await findUser(prisma, {
      fullName: f.managerMiudol,
      ftsBranchType: 'INTERREGIONAL_INSPECTION',
      ftsFunctionRole: 'MANAGER',
    });

    const headCAId = await findUser(prisma, {
      fullName: f.nuZnu,
      ftsBranchType: 'CENTRAL_OFFICE',
      ftsPositionRole: { in: ['CHIEF', 'DEPUTY_CHIEF'] },
    });

    const headMIId = await findUser(prisma, {
      fullName: f.niZni,
      ftsBranchType: 'INTERREGIONAL_INSPECTION',
      ftsPositionRole: { in: ['CHIEF', 'DEPUTY_CHIEF'] },
    });

    // Получаем ID для маркера
    const markerCode = MarkerMap[f.marker];
    if (!markerCode) {
      throw new Error(`Unknown marker: ${f.marker}`);
    }

    // Создаем функцию
    const { id: ftsFunctionId } = await prisma.ftsFunction.create({
      data: {
        ftsCentralizationId: await findType(prisma, 'FTS_CENTRALIZATION', {
          code: CentralizationMap[f.centralization],
        }),
        ftsFunctionNameId: functionNameId,
        competencyCenterId: competencyCenterId,
        curatorCentralOfficeId: curatorId,
        managerInterregionalInspectionId: managerId,
        departmentHeadCentralOfficeId: headCAId,
        departmentHeadInterregionalInspectionId: headMIId,
        ftsFunctionMarkerId: await findType(prisma, 'FTS_FUNCTION_MARKER', {
          code: markerCode,
        }),
      },
      select: { id: true },
    });

    console.log(`Created FtsFunction with id: ${ftsFunctionId}`);

    // Создаем маппинг ID строк из исходных данных на ID в БД
    const rowIdMap = new Map<string, number>();

    // Обрабатываем строки детализации
    for (const row of f.details.rows) {
      console.log(`  Processing row: ${row.id} - ${row.detailText.substring(0, 50)}...`);

      const detailId = await processRow(prisma, ftsFunctionId, row);
      rowIdMap.set(row.id, detailId);

      console.log(`    Created FtsFunctionDetail with id: ${detailId}`);
    }

    // Обрабатываем связи между строками (дерево функций)
    for (const link of f.details.links) {
      const parentDetailId = rowIdMap.get(link.fromId);
      const childDetailId = rowIdMap.get(link.toId);

      if (!parentDetailId) {
        throw new Error(`Parent row with id ${link.fromId} not found for link`);
      }
      if (!childDetailId) {
        console.log(f.id);
        throw new Error(`Child row with id ${link.toId} not found for link`);
      }

      // Получаем ID типа связи
      const relationTypeCode = LinkKindMap[link.kind];
      if (!relationTypeCode) {
        throw new Error(`Unknown link kind: ${link.kind}`);
      }

      const relationTypeId = await findType(prisma, 'FTS_FUNCTION_RELATION_TYPE', {
        code: relationTypeCode,
      });

      // Создаем связь в дереве
      await prisma.ftsFunctionTree.create({
        data: {
          parentFtsFunctionId: parentDetailId,
          childFtsFunctionId: childDetailId,
          relationTypeId: relationTypeId,
        },
      });

      console.log(`  Created link: ${link.fromId} -> ${link.toId} (${link.kind})`);
    }

    console.log(`Completed function: ${f.name}\n`);
  }

  console.log('seedFtsFunctions completed successfully!');
}
