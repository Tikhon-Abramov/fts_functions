import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class DuplicateTreeEdgeException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.DUPLICATE_TREE_EDGE,
        message: ERROR_MESSAGE.DUPLICATE_TREE_EDGE,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
