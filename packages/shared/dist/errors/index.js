"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// errors/index.ts
var errors_exports = {};
__export(errors_exports, {
  ErrorCode: () => ErrorCode
});
module.exports = __toCommonJS(errors_exports);

// errors/codes.ts
var ErrorCode = {
  // Service-layer domain invariants
  TYPE_CATEGORY_MISMATCH: "TYPE_CATEGORY_MISMATCH",
  USER_ROLE_MISMATCH: "USER_ROLE_MISMATCH",
  SELF_LOOP_FORBIDDEN: "SELF_LOOP_FORBIDDEN",
  DUPLICATE_TREE_EDGE: "DUPLICATE_TREE_EDGE",
  FUNCTION_NAME_DUPLICATE: "FUNCTION_NAME_DUPLICATE",
  // Resource not found
  FTS_FUNCTION_NOT_FOUND: "FTS_FUNCTION_NOT_FOUND",
  FTS_FUNCTION_DETAIL_NOT_FOUND: "FTS_FUNCTION_DETAIL_NOT_FOUND",
  FTS_FUNCTION_TREE_EDGE_NOT_FOUND: "FTS_FUNCTION_TREE_EDGE_NOT_FOUND",
  FTS_FUNCTION_DTI_LINK_NOT_FOUND: "FTS_FUNCTION_DTI_LINK_NOT_FOUND",
  TYPE_NOT_FOUND: "TYPE_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  // Generic / infra
  UNIQUE_CONSTRAINT: "UNIQUE_CONSTRAINT",
  FOREIGN_KEY_CONSTRAINT: "FOREIGN_KEY_CONSTRAINT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_CURSOR: "INVALID_CURSOR",
  HTTP_EXCEPTION: "HTTP_EXCEPTION",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  // Auth
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  EMAIL_VERIFICATION_REQUIRED: "EMAIL_VERIFICATION_REQUIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ErrorCode
});
