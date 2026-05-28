import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class TokenExpiredException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.TOKEN_EXPIRED,
        message: ERROR_MESSAGE.TOKEN_EXPIRED,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}
