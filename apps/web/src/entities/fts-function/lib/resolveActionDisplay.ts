import type { FtsFunctionActionType } from "src/entities/fts-function/model";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";

/**
 * Display label for an `FtsFunctionActionType` code, sourced from the DB
 * `Type.name` via `typesAll`. Returns "—" placeholder when the row has no
 * action assigned.
 */
export function resolveActionDisplay(
  typesAll: TypeResponseDto[],
  action: FtsFunctionActionType | "" | undefined,
): string {
  if (!action) return "—";
  return findTypeNameByCode(typesAll, action);
}
