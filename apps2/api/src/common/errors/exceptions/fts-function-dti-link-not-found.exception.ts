import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

/**
 * Thrown when an FtsFunction → DTI join row is not present, e.g. on detach
 * for a (ftsFunctionId, dtiId) pair that was never attached. Distinct from
 * `FtsFunctionNotFoundException` — the function may exist; only the link is
 * missing.
 */
export class FtsFunctionDtiLinkNotFoundException extends HttpException {
  constructor(ftsFunctionId: number, dtiId: number) {
    super(
      {
        code: ErrorCode.FTS_FUNCTION_DTI_LINK_NOT_FOUND,
        message: ERROR_MESSAGE.FTS_FUNCTION_DTI_LINK_NOT_FOUND,
        params: { ftsFunctionId, dtiId },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
