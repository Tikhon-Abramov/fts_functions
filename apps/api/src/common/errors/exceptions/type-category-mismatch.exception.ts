import { HttpException, HttpStatus } from '@nestjs/common';

import { ERROR_MESSAGE } from '@common/strings';
import { ErrorCode } from '@registry/shared';

/**
 * Значение FK на Type не соответствует ожидаемой Category.
 * Формат соответствует триггеру БД (`TYPE_CATEGORY_MISMATCH:<table>.<column>:<category>`),
 * но тело ответа клиенту формируется из structured `params`.
 */
export class TypeCategoryMismatchException extends HttpException {
  constructor(table: string, column: string, category: string) {
    super(
      {
        code: ErrorCode.TYPE_CATEGORY_MISMATCH,
        message: ERROR_MESSAGE.TYPE_CATEGORY_MISMATCH(column, category),
        params: { table, column, category },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
