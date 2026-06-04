import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class EmailVerificationRequiredException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.EMAIL_VERIFICATION_REQUIRED,
        message: ERROR_MESSAGE.EMAIL_VERIFICATION_REQUIRED,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
