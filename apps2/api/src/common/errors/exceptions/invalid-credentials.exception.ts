import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class InvalidCredentialsException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.INVALID_CREDENTIALS,
        message: ERROR_MESSAGE.INVALID_CREDENTIALS,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
