/**
 * Форма тела HTTP-ответа об ошибке.
 * Дискриминируется по `code` — каждый код несёт свою специфическую `params`.
 */
export type ErrorResponseBase = {
  statusCode: number;
  message: string | string[];
  timestamp: string;
};

export type ErrorResponse =
  | (ErrorResponseBase & {
      code: "TYPE_CATEGORY_MISMATCH";
      params: { table: string; column: string; category: string };
    })
  | (ErrorResponseBase & {
      code: "USER_ROLE_MISMATCH";
      params: { slot: string };
    })
  | (ErrorResponseBase & { code: "SELF_LOOP_FORBIDDEN" })
  | (ErrorResponseBase & { code: "DUPLICATE_TREE_EDGE" })
  | (ErrorResponseBase & {
      code: "FTS_FUNCTION_NOT_FOUND";
      params: { id: number };
    })
  | (ErrorResponseBase & {
      code: "FTS_FUNCTION_DETAIL_NOT_FOUND";
      params: { id: number };
    })
  | (ErrorResponseBase & {
      code: "FTS_FUNCTION_TREE_EDGE_NOT_FOUND";
      params: { parentId: number; childId: number };
    })
  | (ErrorResponseBase & { code: "TYPE_NOT_FOUND"; params: { id: number } })
  | (ErrorResponseBase & { code: "USER_NOT_FOUND"; params: { id: number } })
  | (ErrorResponseBase & { code: "RESOURCE_NOT_FOUND" })
  | (ErrorResponseBase & {
      code: "UNIQUE_CONSTRAINT";
      params?: { target?: string[] };
    })
  | (ErrorResponseBase & {
      code: "FOREIGN_KEY_CONSTRAINT";
      params?: { field?: string };
    })
  | (ErrorResponseBase & {
      code: "VALIDATION_ERROR";
      params?: { issues?: unknown[] };
    })
  | (ErrorResponseBase & { code: "HTTP_EXCEPTION" })
  | (ErrorResponseBase & { code: "INTERNAL_SERVER_ERROR" })
  | (ErrorResponseBase & { code: "INVALID_CREDENTIALS" })
  | (ErrorResponseBase & { code: "EMAIL_ALREADY_REGISTERED" })
  | (ErrorResponseBase & { code: "EMAIL_NOT_VERIFIED" })
  | (ErrorResponseBase & { code: "EMAIL_VERIFICATION_REQUIRED" })
  | (ErrorResponseBase & { code: "INVALID_TOKEN" })
  | (ErrorResponseBase & { code: "TOKEN_EXPIRED" });
