import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { LogOptions } from 'src/generated/prisma/internal/class';
import { PrismaClientOptions } from 'src/generated/prisma/internal/prismaNamespace';

import { CONFIG_KEY, type DatabaseConfig } from '@common/config';
import { PrismaClient } from '@prisma-client';

@Injectable()
export class PrismaService
  extends PrismaClient<PrismaClientOptions, LogOptions<PrismaClientOptions>>
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const database = configService.getOrThrow<DatabaseConfig>(CONFIG_KEY.DATABASE);

    const adapter = new PrismaMariaDb({
      host: database.host,
      user: database.user,
      password: database.password,
      port: database.port,
      database: database.name,
      connectTimeout: 5000,
      allowPublicKeyRetrieval: true,
    });

    super({
      adapter,
      omit: {
        // Default-omit пароль из всех select() запросов. Чтобы прочитать
        // (например, для проверки credentials) — нужен явный repository
        // метод вида `findByEmailWithPasswordHash` с `omit: { passwordHash: false }`.
        user: {
          passwordHash: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
