import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from 'dotenv';


dotenv.config();

const adapter = new PrismaMariaDb({
  host: process.env['DATABASE_HOST'],
  user: process.env['DATABASE_USER'],
  password: process.env['DATABASE_PASSWORD'],
  port: Number(process.env['DATABASE_PORT']),
  database: process.env['DATABASE_NAME'],
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({
  adapter,
});

async function main(): Promise<void> {
  const types: Prisma.TypeCreateManyInput[] = [
    { category: 'CHARACTER_ACTION', code: 'EXCLUDE_ACTION', name: 'Исключить' },
    { category: 'CHARACTER_ACTION', code: 'OPTIMIZE_ACTION', name: 'Оптимизировать' },

    { category: 'PERSON_PERFORMING_ACTION', code: 'CHIEF', name: 'Начальник' },
    { category: 'PERSON_PERFORMING_ACTION', code: 'DEPUTY_CHIEF', name: 'Заместитель начальника отдела' },
    { category: 'PERSON_PERFORMING_ACTION', code: 'INSPECTOR', name: 'Инспектор' },
    { category: 'PERSON_PERFORMING_ACTION', code: 'OTHER_PERSON', name: 'Иное' },

    { category: 'FTS_FUNCTION_NAME', code: 'FTS_FUNCTION_OTHER', name: 'Иное наименование' },

    { category: 'FTS_FUNCTION_EXECUTION_FREQUENCY', code: 'QUARTERLY', name: 'Ежеквартально' },
  ];

  for (const t of types) {
    await prisma.type.upsert({
      where: { code: t.code },
      update: t,
      create: t,
    });
  }
  console.log('Константы добавлены');
}


main()
  .catch((e) => {
    console.error('Error seeding types:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
