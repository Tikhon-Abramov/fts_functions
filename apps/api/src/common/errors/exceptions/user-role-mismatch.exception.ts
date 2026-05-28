import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class UserRoleMismatchException extends HttpException {
  constructor(slot: string) {
    super(
      {
        code: ErrorCode.USER_ROLE_MISMATCH,
        message: ERROR_MESSAGE.USER_ROLE_MISMATCH(slot),
        params: { slot },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
