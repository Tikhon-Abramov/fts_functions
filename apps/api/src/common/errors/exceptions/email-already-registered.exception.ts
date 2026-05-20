import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class EmailAlreadyRegisteredException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.EMAIL_ALREADY_REGISTERED,
        message: ERROR_MESSAGE.EMAIL_ALREADY_REGISTERED,
      },
      HttpStatus.CONFLICT,
    );
  }
}
