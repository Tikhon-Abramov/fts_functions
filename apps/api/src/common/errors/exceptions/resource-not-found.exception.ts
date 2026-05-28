import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class ResourceNotFoundException extends HttpException {
  constructor(message: string = ERROR_MESSAGE.RESOURCE_NOT_FOUND) {
    super(
      {
        code: ErrorCode.RESOURCE_NOT_FOUND,
        message,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
