import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class ForeignKeyConstraintException extends HttpException {
  constructor(field?: string, message: string = ERROR_MESSAGE.FOREIGN_KEY_CONSTRAINT) {
    super(
      {
        code: ErrorCode.FOREIGN_KEY_CONSTRAINT,
        message,
        ...(field ? { params: { field } } : {}),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
