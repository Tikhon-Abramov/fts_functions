import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { envBaseSchema, envLocalSchema } from '@common/schemas/env.schema';
import { PrismaModule } from './module/prisma/prisma.module';
import { AuthModule } from './module/auth/auth.module';
import { ConstantModule } from './module/constant/constant.module';
import { FtsFunctionModule } from "./module/fts-function/fts-function.module";
import { FtsFunctionDetailModule } from './module/fts-function-detail/fts-function-detail.module';
import { FeedbackModule } from './module/feedback/feedback.module';
import { ActionModule } from './module/action/action.module';
import { FilesModule } from './module/file/file.module';
import { ExportModule } from './module/export/export.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `${process.cwd()}/.env.${process.env['NODE_ENV']}.local`,
        `${process.cwd()}/.env`,
      ],
      validate: (config) => {
        const processedConfig = { ...config };

        const result = envLocalSchema.safeParse(processedConfig);
        if (!result.success) {
          console.error(
            `Неверно заданные переменные окружения в  .env.${process.env['NODE_ENV']}.local:`,
            result.error.format(),
          );
          throw new Error(
            `Неверно заданные переменные окружения в  .env.${process.env['NODE_ENV']}.local`,
          );
        }

        const baseResult = envBaseSchema.safeParse(processedConfig);
        if (!baseResult.success) {
          console.error(
            'Неверно заданные переменные окружения в  .env:',
            baseResult.error.format(),
          );
          throw new Error('Неверно заданные переменные окружения в  .env');
        }

        return result.data;
      },
    }),
    ...(process.env['NODE_ENV'] === 'production'
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, '../..', 'frontend', 'dist'),
            serveStaticOptions: {
              fallthrough: true,
            },
          }),
        ]
      : []),
    // LoggerModule.forRoot(logger),
    // ThrottlerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => [
    //     {
    //       ttl: seconds(config.get('THROTTLE_TTL') ?? 60),
    //       limit: config.get('THROTTLE_LIMIT') ?? 100,
    //     },
    //   ],
    // }),
    PrismaModule,
    AuthModule,
    ConstantModule,
    FtsFunctionModule,
    FtsFunctionDetailModule,
    FeedbackModule,
    ActionModule,
    FilesModule,
    ExportModule,
  ],
  // providers: [
  //   {
  //     provide: APP_GUARD,
  //     useClass: ThrottlerGuard,
  //   },
  // ],
})
export class AppModule {}
