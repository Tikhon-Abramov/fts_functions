import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../prisma/prisma.service';

const DB_PROBE_TIMEOUT_MS = 1000;

export type HealthResponse = {
  status: 'ok';
  version: string;
  uptime: number;
  db: 'connected' | 'disconnected';
};

/** GET /v1/health — liveness + readiness probe. */
@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness/readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is up; db field reflects DB connectivity.' })
  async check(): Promise<HealthResponse> {
    return {
      status: 'ok',
      version: process.env['APP_VERSION'] ?? 'dev',
      uptime: process.uptime(),
      db: (await this.probeDb()) ? 'connected' : 'disconnected',
    };
  }

  private async probeDb(): Promise<boolean> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    try {
      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error('db probe timeout')),
          DB_PROBE_TIMEOUT_MS,
        );
      });
      await Promise.race([this.prisma.$queryRawUnsafe('SELECT 1'), timeoutPromise]);
      return true;
    } catch {
      return false;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
}
