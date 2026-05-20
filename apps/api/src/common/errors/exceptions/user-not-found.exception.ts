import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class UserNotFoundException extends HttpException {
  constructor(id: number) {
    super(
      {
        code: ErrorCode.USER_NOT_FOUND,
        message: ERROR_MESSAGE.USER_NOT_FOUND,
        params: { id },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
