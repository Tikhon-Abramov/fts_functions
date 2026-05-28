import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class InvalidTokenException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.INVALID_TOKEN,
        message: ERROR_MESSAGE.INVALID_TOKEN,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
