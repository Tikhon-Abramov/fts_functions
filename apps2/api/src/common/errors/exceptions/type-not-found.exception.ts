import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class TypeNotFoundException extends HttpException {
  constructor(id: number) {
    super(
      {
        code: ErrorCode.TYPE_NOT_FOUND,
        message: ERROR_MESSAGE.TYPE_NOT_FOUND,
        params: { id },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
