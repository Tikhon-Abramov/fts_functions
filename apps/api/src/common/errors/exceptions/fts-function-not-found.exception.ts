import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class FtsFunctionNotFoundException extends HttpException {
  constructor(id: number) {
    super(
      {
        code: ErrorCode.FTS_FUNCTION_NOT_FOUND,
        message: ERROR_MESSAGE.FTS_FUNCTION_NOT_FOUND,
        params: { id },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
