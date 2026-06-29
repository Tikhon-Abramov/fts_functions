import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import compress from '@fastify/compress';
import fastyfyMultipart from '@fastify/multipart';
import { ConfigService } from '@nestjs/config';
import fastifyRoutes from '@fastify/routes';
import fastifyCookie, { FastifyCookieOptions } from '@fastify/cookie';
import { fastifyHelmet } from '@fastify/helmet';
import { patchNestjsSwagger } from '@anatine/zod-nestjs';
import { DocumentBuilder, getSchemaPath, SwaggerModule } from '@nestjs/swagger';
import { dirname, join } from 'node:path';
import { PrismaModel } from 'src/generated/prisma-class';
import { AppModule } from './app.module';
import { ErrorResponseDto } from "@common/schemas/error-response.schema";
import { setConsoleToUTF8 } from "@common/utils/console-utf8";
import qs from 'qs';



async function configureApp(app: NestFastifyApplication, isProduction: boolean) {
  const configService = app.get(ConfigService);

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  });

  await app.register(fastyfyMultipart, {
    limits: {
    fileSize: configService.get<number>('MAX_UPLOAD_SIZE', { infer: true }),
    },
  });

  await app.register(compress, { encodings: ['gzip', 'deflate'] });

  app.enableVersioning({
    type: VersioningType.URI,
  });

 
  patchNestjsSwagger();
  const config = new DocumentBuilder()
    .setTitle('Реестр функций ФНС API')
    .setVersion('0.0.1')
    .addTag('Auth', 'Аутентификация и авторизация пользователей')
    .addTag('Constant', 'Справочные данные')
    .addTag('File', 'Управление файлами: загрузка, скачивание, удаление')
    .addTag('Export', 'Экспорт данных системы: выгрузка в виде эксель-файла')
    .addTag('FtsFunction', 'Управление функциями: получение списка функций, детализированной информации, добавление, редактирование, удаление')
    .addTag('FtsFunctionDetail', 'Управление детализациями функций: получение списка функций, детализированной информации, добавление, редактирование, удаление, изменение порядка')
    .addTag('Feedback', 'Обратная связь')
    .addTag('Action', 'Операции')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Введите токен, полученный после авторизации',
      },
    )
    .addGlobalResponse({
      status: 500,
      description: 'Внутренняя ошибка сервера',
      schema: { $ref: getSchemaPath(ErrorResponseDto) },
    })
    .addSecurityRequirements('bearer')
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
    yamlDocumentUrl: 'api/yaml'
  });

  await app.register(fastifyRoutes);

  await app.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET', { infer: true }),
    parseOptions: {
      secure: false,
      sameSite: 'lax',
    },
  } as FastifyCookieOptions);

  const host = configService.get<string>('NODE_HOST', { infer: true }) || '0.0.0.0';
  const port = configService.get<number>('NODE_HTTP_PORT', { infer: true }) || 3000;

  const url = `http://${host}:${port}`;

  app.enableCors({
    origin: isProduction ? [url] : true,
    credentials: true,
    exposedHeaders: [
      'X-App-Version',
      'X-Maintenance-Ms-Left',
      'X-Maintenance-Start-Time',
      'X-Maintenance-End-Time'
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  return { host, port, url };
}


async function bootstrap(): Promise<void> {
  const isProduction = process.env['NODE_ENV'] === 'production';

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

    const { host, port, url } = await configureApp(app, isProduction);

    await app.listen({ port, host });

    console.log(`Сервер запущен по адресу ${url}`);
  } catch (error) {
    console.error('Ошибка при старте сервера:', error);
    process.exit(1);
  }
}


setConsoleToUTF8();
void bootstrap();
