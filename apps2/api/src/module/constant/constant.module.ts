import { Module } from '@nestjs/common';

import { ConstantController } from './constant.controller';
import { ConstantService } from './constant.service';

// FTS-NO-AUTH BRANCH: AuthModule import removed so passport never loads.
// Restore for prod: `import { AuthModule } from '../auth/auth.module';`
// and add `imports: [AuthModule]` below.
@Module({
  controllers: [ConstantController],
  providers: [ConstantService],
})
export class ConstantModule {}
