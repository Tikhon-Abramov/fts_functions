import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class UniqueConstraintException extends HttpException {
  constructor(target?: string[], message: string = ERROR_MESSAGE.UNIQUE_CONSTRAINT) {
    super(
      {
        code: ErrorCode.UNIQUE_CONSTRAINT,
        message,
        ...(target ? { params: { target } } : {}),
      },
      HttpStatus.CONFLICT,
    );
  }
}
