import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class FunctionNameDuplicateException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.FUNCTION_NAME_DUPLICATE,
        message: ERROR_MESSAGE.FUNCTION_NAME_DUPLICATE,
      },
      HttpStatus.CONFLICT,
    );
  }
}
