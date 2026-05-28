/**
 * Bootstraps a NestFastifyApplication for auth + profile e2e tests with
 * stubs for outbound integrations (Resend email, MinIO storage). Mirrors
 * `helpers/app.ts` but uses Test.createTestingModule for provider overrides.
 */
import type { FastifyInstance } from 'fastify';

import fastifyMultipart from '@fastify/multipart';
import { VersioningType } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import qs from 'qs';

import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';

import { applyE2EEnv } from '../env-e2e';

applyE2EEnv();

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports */
const { AppModule } = require('../../src/app.module') as typeof import('../../src/app.module');
const { EMAIL_SERVICE } =
  require('../../src/module/email/email.types') as typeof import('../../src/module/email/email.types');
const { MinioService } =
  require('../../src/module/storage/minio.service') as typeof import('../../src/module/storage/minio.service');

const { PrismaService } =
  require('../../src/module/prisma/prisma.service') as typeof import('../../src/module/prisma/prisma.service');
const { setupSql } = require('../../db/sql') as typeof import('../../db/sql');
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/consistent-type-imports */

export type SentEmail = {
  kind: 'verification' | 'password-reset';
  to: string;
  fullName: string;
  token: string;
};

export type EmailStub = {
  sentEmails: SentEmail[];
  sendVerificationEmail: jest.Mock;
  sendPasswordResetEmail: jest.Mock;
};

export type MinioStub = {
  uploads: Array<{ key: string; contentType: string }>;
  putObjects: Array<{ bucket: string; key: string; size: number; contentType: string }>;
  deletes: string[];
  ensureBucket: jest.Mock;
  getPresignedUploadUrl: jest.Mock;
  getPresignedDownloadUrl: jest.Mock;
  deleteObject: jest.Mock;
  putObject: jest.Mock;
  onModuleInit: jest.Mock;
};

export type AuthTestAppContext = {
  app: NestFastifyApplication;
  prisma: InstanceType<typeof PrismaService>;
  httpServer: FastifyInstance;
  email: EmailStub;
  minio: MinioStub;
};

function makeEmailStub(): EmailStub {
  const sentEmails: SentEmail[] = [];
  return {
    sentEmails,
    sendVerificationEmail: jest.fn((to: string, fullName: string, token: string) => {
      sentEmails.push({ kind: 'verification', to, fullName, token });
      return Promise.resolve();
    }),
    sendPasswordResetEmail: jest.fn((to: string, fullName: string, token: string) => {
      sentEmails.push({ kind: 'password-reset', to, fullName, token });
      return Promise.resolve();
    }),
  };
}

function makeMinioStub(): MinioStub {
  const uploads: Array<{ key: string; contentType: string }> = [];
  const putObjects: Array<{ bucket: string; key: string; size: number; contentType: string }> = [];
  const deletes: string[] = [];
  return {
    uploads,
    putObjects,
    deletes,
    ensureBucket: jest.fn().mockResolvedValue(undefined),
    onModuleInit: jest.fn().mockResolvedValue(undefined),
    getPresignedUploadUrl: jest.fn((key: string, contentType: string) => {
      uploads.push({ key, contentType });
      return Promise.resolve({
        uploadUrl: `https://minio.test/upload/${encodeURIComponent(key)}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
    }),
    getPresignedDownloadUrl: jest.fn((key: string) =>
      Promise.resolve({
        downloadUrl: `https://minio.test/download/${encodeURIComponent(key)}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      }),
    ),
    deleteObject: jest.fn((key: string) => {
      deletes.push(key);
      return Promise.resolve();
    }),
    putObject: jest.fn((bucket: string, key: string, body: Buffer, contentType: string) => {
      putObjects.push({ bucket, key, size: body.length, contentType });
      return Promise.resolve();
    }),
  };
}

export async function createAuthTestApp(): Promise<AuthTestAppContext> {
  const email = makeEmailStub();
  const minio = makeMinioStub();

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EMAIL_SERVICE)
    .useValue(email)
    .overrideProvider(MinioService)
    .useValue(minio)
    .compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({
      routerOptions: { querystringParser: (str) => qs.parse(str) },
      trustProxy: true,
    }),
    { logger: false },
  );

  app.enableVersioning({ type: VersioningType.URI });
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Register multipart so /v1/profile/avatar (multipart upload) works in e2e.
  await app.register(fastifyMultipart, {
    limits: { fileSize: 2 * 1024 * 1024 },
  });

  const prisma = app.get(PrismaService);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  await setupSql(prisma);

  const httpServer = app.getHttpAdapter().getInstance();
  return { app, prisma, httpServer, email, minio };
}

export async function closeAuthTestApp(ctx: AuthTestAppContext | undefined): Promise<void> {
  if (!ctx) return;
  await ctx.app.close();
}

/**
 * Удаляет всех тестовых пользователей по email-prefix'у — гарантирует
 * изоляцию между тестами. Не трогает seeded-юзеров (у них email = null).
 */
export async function cleanupAuthUsers(
  prisma: InstanceType<typeof PrismaService>,
  emailPrefix: string,
): Promise<void> {
  // First clean tokens (FK protection).
  const users = await prisma.user.findMany({
    where: { email: { startsWith: emailPrefix } },
    select: { id: true },
  });
  const ids = users.map((u: { id: number }) => u.id);
  if (ids.length === 0) return;
  await prisma.refreshTokenBlacklist.deleteMany({ where: { userId: { in: ids } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}
