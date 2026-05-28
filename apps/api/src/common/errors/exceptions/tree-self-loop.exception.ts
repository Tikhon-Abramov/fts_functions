import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class TreeSelfLoopException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.SELF_LOOP_FORBIDDEN,
        message: ERROR_MESSAGE.TREE_SELF_LOOP,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
