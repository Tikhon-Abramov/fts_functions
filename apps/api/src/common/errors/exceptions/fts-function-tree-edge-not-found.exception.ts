import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

export class FtsFunctionTreeEdgeNotFoundException extends HttpException {
  constructor(parentId: number, childId: number) {
    super(
      {
        code: ErrorCode.FTS_FUNCTION_TREE_EDGE_NOT_FOUND,
        message: ERROR_MESSAGE.FTS_FUNCTION_TREE_EDGE_NOT_FOUND,
        params: { parentId, childId },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
