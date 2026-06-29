/**
 * Единый словарь кодов ошибок, которые уходят клиенту.
 * Используется на бэкенде (типизированные исключения) и на фронтенде
 * (словарь переводов `errors.json`).
 */
declare const ErrorCode: {
    readonly TYPE_CATEGORY_MISMATCH: "TYPE_CATEGORY_MISMATCH";
    readonly USER_ROLE_MISMATCH: "USER_ROLE_MISMATCH";
    readonly SELF_LOOP_FORBIDDEN: "SELF_LOOP_FORBIDDEN";
    readonly DUPLICATE_TREE_EDGE: "DUPLICATE_TREE_EDGE";
    readonly FUNCTION_NAME_DUPLICATE: "FUNCTION_NAME_DUPLICATE";
    readonly FTS_FUNCTION_NOT_FOUND: "FTS_FUNCTION_NOT_FOUND";
    readonly FTS_FUNCTION_DETAIL_NOT_FOUND: "FTS_FUNCTION_DETAIL_NOT_FOUND";
    readonly FTS_FUNCTION_TREE_EDGE_NOT_FOUND: "FTS_FUNCTION_TREE_EDGE_NOT_FOUND";
    readonly FTS_FUNCTION_DTI_LINK_NOT_FOUND: "FTS_FUNCTION_DTI_LINK_NOT_FOUND";
    readonly TYPE_NOT_FOUND: "TYPE_NOT_FOUND";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND";
    readonly UNIQUE_CONSTRAINT: "UNIQUE_CONSTRAINT";
    readonly FOREIGN_KEY_CONSTRAINT: "FOREIGN_KEY_CONSTRAINT";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_CURSOR: "INVALID_CURSOR";
    readonly HTTP_EXCEPTION: "HTTP_EXCEPTION";
    readonly INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED";
    readonly EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED";
    readonly EMAIL_VERIFICATION_REQUIRED: "EMAIL_VERIFICATION_REQUIRED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
};
type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Форма тела HTTP-ответа об ошибке.
 * Дискриминируется по `code` — каждый код несёт свою специфическую `params`.
 */
type ErrorResponseBase = {
    statusCode: number;
    message: string | string[];
    timestamp: string;
};
type ErrorResponse = (ErrorResponseBase & {
    code: "TYPE_CATEGORY_MISMATCH";
    params: {
        table: string;
        column: string;
        category: string;
    };
}) | (ErrorResponseBase & {
    code: "USER_ROLE_MISMATCH";
    params: {
        slot: string;
    };
}) | (ErrorResponseBase & {
    code: "SELF_LOOP_FORBIDDEN";
}) | (ErrorResponseBase & {
    code: "DUPLICATE_TREE_EDGE";
}) | (ErrorResponseBase & {
    code: "FTS_FUNCTION_NOT_FOUND";
    params: {
        id: number;
    };
}) | (ErrorResponseBase & {
    code: "FTS_FUNCTION_DETAIL_NOT_FOUND";
    params: {
        id: number;
    };
}) | (ErrorResponseBase & {
    code: "FTS_FUNCTION_TREE_EDGE_NOT_FOUND";
    params: {
        parentId: number;
        childId: number;
    };
}) | (ErrorResponseBase & {
    code: "TYPE_NOT_FOUND";
    params: {
        id: number;
    };
}) | (ErrorResponseBase & {
    code: "USER_NOT_FOUND";
    params: {
        id: number;
    };
}) | (ErrorResponseBase & {
    code: "RESOURCE_NOT_FOUND";
}) | (ErrorResponseBase & {
    code: "UNIQUE_CONSTRAINT";
    params?: {
        target?: string[];
    };
}) | (ErrorResponseBase & {
    code: "FOREIGN_KEY_CONSTRAINT";
    params?: {
        field?: string;
    };
}) | (ErrorResponseBase & {
    code: "VALIDATION_ERROR";
    params?: {
        issues?: unknown[];
    };
}) | (ErrorResponseBase & {
    code: "HTTP_EXCEPTION";
}) | (ErrorResponseBase & {
    code: "INTERNAL_SERVER_ERROR";
}) | (ErrorResponseBase & {
    code: "INVALID_CREDENTIALS";
}) | (ErrorResponseBase & {
    code: "EMAIL_ALREADY_REGISTERED";
}) | (ErrorResponseBase & {
    code: "EMAIL_NOT_VERIFIED";
}) | (ErrorResponseBase & {
    code: "EMAIL_VERIFICATION_REQUIRED";
}) | (ErrorResponseBase & {
    code: "INVALID_TOKEN";
}) | (ErrorResponseBase & {
    code: "TOKEN_EXPIRED";
});

export { ErrorCode, type ErrorResponse, type ErrorResponseBase };
