import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class EmailNotVerifiedException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.EMAIL_NOT_VERIFIED,
        message: ERROR_MESSAGE.EMAIL_NOT_VERIFIED,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
