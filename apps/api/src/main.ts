import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { fastifyHelmet } from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyRoutes from '@fastify/routes';
import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, getSchemaPath, SwaggerModule } from '@nestjs/swagger';
import qs from 'qs';

import { CONFIG_KEY, type DatabaseConfig, type NodeConfig } from '@common/config';
import { GlobalExceptionFilter } from '@common/filters/global-exception.filter';
import { ErrorResponseDto } from '@common/schemas/error-response.schema';
import { LOG_MESSAGE, SWAGGER_DESCRIPTION } from '@common/strings';
import { setConsoleToUTF8 } from '@common/utils/console-utf8';
import { PrismaModel } from '@prisma-class';

import { setupSql } from '../db/sql';

import { AppModule } from './app.module';

async function configureApp(app: NestFastifyApplication) {
  const configService = app.get(ConfigService);
  const node = configService.getOrThrow<NodeConfig>(CONFIG_KEY.NODE);

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  });

  // Multipart upload support — used by `POST /v1/profile/avatar` so the
  // browser can ship the binary through the API instead of a presigned
  // direct-PUT to MinIO (presigned URLs from the public MinIO endpoint
  // hit mixed-content blocks when the site is served over HTTPS).
  await app.register(fastifyMultipart, {
    limits: { fileSize: 2 * 1024 * 1024 },
  });

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  patchNestjsSwagger();
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_DESCRIPTION.API_TITLE)
    .setVersion('0.0.1')
    .addTag('Constant', SWAGGER_DESCRIPTION.TAG_CONSTANT)
    .addGlobalResponse({
      status: 500,
      description: SWAGGER_DESCRIPTION.INTERNAL_SERVER_ERROR,
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [...PrismaModel.extraModels, ErrorResponseDto],
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    jsonDocumentUrl: 'api/json',
    yamlDocumentUrl: 'api/yaml',
  });

  await app.register(fastifyRoutes);

  app.enableCors({
    origin: node.isProduction ? [node.url] : true,
    credentials: true,
    exposedHeaders: [
      'X-App-Version',
      'X-Maintenance-Ms-Left',
      'X-Maintenance-Start-Time',
      'X-Maintenance-End-Time',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  return { host: node.host, port: node.httpPort, url: node.url };
}

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        routerOptions: {
          querystringParser: (str) => qs.parse(str),
        },
        trustProxy: true,
      }),
      { bufferLogs: true },
    );

    const { host, port, url } = await configureApp(app);

    await app.listen({ port, host });

    console.log(`${LOG_MESSAGE.SERVER_STARTED} ${url}`);
  } catch (error) {
    console.error(LOG_MESSAGE.BOOTSTRAP_FAILED, error);
    process.exit(1);
  }
}

setConsoleToUTF8();
void bootstrap();
