import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class ValidationErrorException extends HttpException {
  constructor(issues?: unknown[], message: string | string[] = ERROR_MESSAGE.VALIDATION_FAILED) {
    super(
      {
        code: ErrorCode.VALIDATION_ERROR,
        message,
        ...(issues ? { params: { issues } } : {}),
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
