/**
 * Bootstraps a NestFastifyApplication wired to the e2e DB.
 *
 * Mirrors src/main.ts#configureApp for: global filter, URI versioning.
 * (Swagger / helmet / CORS are not exercised by HTTP-level tests, so we skip
 *  them to keep bootstrap cheap.)
 */
import type { FastifyInstance } from 'fastify';

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import qs from 'qs';

import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';

import { applyE2EEnv } from '../env-e2e';

applyE2EEnv();

// Import *after* env is applied so PrismaService reads the right DATABASE_*.
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports */
const { AppModule } = require('../../src/app.module') as typeof import('../../src/app.module');

const { PrismaService } =
  require('../../src/module/prisma/prisma.service') as typeof import('../../src/module/prisma/prisma.service');
const { setupSql } = require('../../db/sql') as typeof import('../../db/sql');
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports */

export type TestAppContext = {
  app: NestFastifyApplication;
  prisma: InstanceType<typeof PrismaService>;
  httpServer: FastifyInstance;
};

export async function createTestApp(): Promise<TestAppContext> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      routerOptions: {
        querystringParser: (str) => qs.parse(str),
      },
      trustProxy: true,
    }),
    { logger: false },
  );

  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalFilters(new GlobalExceptionFilter());

  const prisma = app.get(PrismaService);

  await app.init();
  // Fastify requires this before inject() works reliably for routes.
  await app.getHttpAdapter().getInstance().ready();

  // Install DB triggers (defense-in-depth) just like main.ts does.
  await setupSql(prisma);

  const httpServer = app.getHttpAdapter().getInstance();

  return { app, prisma, httpServer };
}

export async function closeTestApp(ctx: TestAppContext | undefined): Promise<void> {
  if (!ctx) return;
  await ctx.app.close();
}
