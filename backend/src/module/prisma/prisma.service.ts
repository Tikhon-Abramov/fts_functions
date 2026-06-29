import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "src/generated/prisma/client";
import { LogOptions } from "src/generated/prisma/internal/class";
import { PrismaClientOptions } from "src/generated/prisma/internal/prismaNamespace";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class PrismaService
  extends PrismaClient<PrismaClientOptions, LogOptions<PrismaClientOptions>>
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaMariaDb({
      host: process.env['DATABASE_HOST'],
      user: process.env['DATABASE_USER'],
      password: process.env['DATABASE_PASSWORD'],
      port: Number(process.env['DATABASE_PORT']),
      database: process.env['DATABASE_NAME'],
      // connectionLimit: Number(process.env['DATABASE_CONNECTION_LIMIT']),
      // connectTimeout: 5000,
      allowPublicKeyRetrieval: true,
    });

    super({
      adapter,
      omit: {
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
