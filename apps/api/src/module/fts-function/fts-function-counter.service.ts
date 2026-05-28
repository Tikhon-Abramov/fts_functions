import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

/**
 * In-memory cached overall total of non-deleted FtsFunction rows.
 *
 * Seeded at module init. Refreshed every 60 seconds as a safety net in
 * case an out-of-band DB write bypassed {@link onCreate} / {@link onSoftDelete}.
 *
 * Only the overall total is cached today; the planned LRU cache for
 * filtered totals is documented in `docs/known-limitations.md`.
 */
@Injectable()
export class FtsFunctionCounterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FtsFunctionCounterService.name);
  private overallTotalValue = 0;
  private interval: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.refresh();
    this.interval = setInterval(() => {
      this.refresh().catch((err) => this.logger.warn(`Scheduled refresh failed: ${String(err)}`));
    }, 60_000);
    // Don't keep the event loop alive solely for this timer.
    if (this.interval.unref) this.interval.unref();
  }

  onModuleDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  get overallTotal(): number {
    return this.overallTotalValue;
  }

  onCreate(): void {
    this.overallTotalValue += 1;
  }

  onSoftDelete(): void {
    // Clamp at zero to avoid corruption if a double-delete slips through.
    this.overallTotalValue = Math.max(0, this.overallTotalValue - 1);
  }

  async refresh(): Promise<void> {
    const count = await this.prisma.ftsFunction.count({
      where: { isDeleted: false },
    });
    this.overallTotalValue = count;
  }
}
