import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '../../module/prisma/prisma.module';

import { AuditService } from './audit.service';

/** Global audit module — `AuditService` injectable anywhere without re-import. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
