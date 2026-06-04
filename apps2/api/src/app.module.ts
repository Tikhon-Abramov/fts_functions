import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';

import { AuditModule } from '@common/audit';
import { loadAndValidateConfig } from '@common/config';

import { ConstantModule } from './module/constant/constant.module';
import { FtsFunctionModule } from './module/fts-function/fts-function.module';
import { HealthModule } from './module/health/health.module';
import { PrismaModule } from './module/prisma/prisma.module';

// Compile-time enum contract check (fails the build if Prisma enums drift
// from the @registry/shared enum mirrors).
import '@common/contract/enum-assertions';

const nodeMode = process.env['NODE_ENV'] ?? 'development';
const isProduction = nodeMode === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`${process.cwd()}/.env.${nodeMode}.local`, `${process.cwd()}/.env`],
      load: [loadAndValidateConfig],
    }),

    ...(isProduction
        ? [
          ServeStaticModule.forRoot({
            // From compiled file location (apps/api/dist/src/), three `..`
            // reach `apps/`, then `web/dist`.
            rootPath: join(__dirname, '../../..', 'web', 'dist'),
            serveStaticOptions: { fallthrough: true },
          }),
        ]
        : []),

    PrismaModule,
    AuditModule,
    ConstantModule,
    FtsFunctionModule,
    HealthModule,
  ],
  providers: [],
})
export class AppModule {}