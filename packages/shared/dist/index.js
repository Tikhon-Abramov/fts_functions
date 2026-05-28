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

// index.ts
var index_exports = {};
__export(index_exports, {
  ActionHistoryType: () => ActionHistoryType,
  COLOR_PRESETS: () => COLOR_PRESETS,
  CRR_REGEX: () => CRR_REGEX,
  Category: () => Category,
  ErrorCode: () => ErrorCode,
  FtsBranchType: () => FtsBranchType,
  FtsFunctionActionType: () => FtsFunctionActionType,
  FtsFunctionCategory: () => FtsFunctionCategory,
  FtsFunctionComplexity: () => FtsFunctionComplexity,
  FtsFunctionExecutionFrequency: () => FtsFunctionExecutionFrequency,
  FtsFunctionRelationType: () => FtsFunctionRelationType,
  FtsFunctionRole: () => FtsFunctionRole,
  FtsFunctionStep: () => FtsFunctionStep,
  FtsPositionRole: () => FtsPositionRole,
  LOGIN_REGEX: () => LOGIN_REGEX,
  LOTUS_REGEX_2: () => LOTUS_REGEX_2,
  LOTUS_REGEX_3: () => LOTUS_REGEX_3,
  MAX_DATE: () => MAX_DATE,
  MIN_DATE: () => MIN_DATE,
  NAME_REGEX: () => NAME_REGEX,
  PASSWORD_REGEX: () => PASSWORD_REGEX,
  PHONE_REGEX: () => PHONE_REGEX,
  TIN_REGEX: () => TIN_REGEX,
  TITLE_MAX_LENGTH: () => TITLE_MAX_LENGTH,
  UserRole: () => UserRole
});
module.exports = __toCommonJS(index_exports);

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

// enums/fts-function-category.ts
var FtsFunctionCategory = {
  METHODOLOGY: "METHODOLOGY",
  ACTUAL_ACTION: "ACTUAL_ACTION",
  CONTROL_ANALYTICS: "CONTROL_ANALYTICS"
};

// enums/fts-function-step.ts
var FtsFunctionStep = {
  OBJECT_SELECTION: "OBJECT_SELECTION",
  CLUSTERING_IMPACT: "CLUSTERING_IMPACT"
};

// enums/fts-function-action-type.ts
var FtsFunctionActionType = {
  KEEP: "KEEP",
  TRANSFER: "TRANSFER",
  OPTIMIZE: "OPTIMIZE",
  OPTIMIZE_TRANSFER: "OPTIMIZE_TRANSFER",
  REMOVE: "REMOVE"
};

// enums/fts-function-execution-frequency.ts
var FtsFunctionExecutionFrequency = {
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY"
};

// enums/fts-function-complexity.ts
var FtsFunctionComplexity = {
  SIMPLE: "SIMPLE",
  MIDDLE: "MIDDLE",
  HARD: "HARD"
};

// enums/fts-function-relation-type.ts
var FtsFunctionRelationType = {
  CONNECTED: "CONNECTED",
  DEPENDS_ON: "DEPENDS_ON",
  CONTROLS: "CONTROLS"
};

// enums/index.ts
var UserRole = {
  ADMIN: "ADMIN",
  USER: "USER"
};
var FtsPositionRole = {
  DEPUTY_CHIEF: "DEPUTY_CHIEF",
  CHIEF: "CHIEF"
};
var FtsFunctionRole = {
  CURATOR: "CURATOR",
  MANAGER: "MANAGER"
};
var FtsBranchType = {
  CENTRAL_OFFICE: "CENTRAL_OFFICE",
  INTERREGIONAL_INSPECTION: "INTERREGIONAL_INSPECTION"
};
var Category = {
  FTS_CENTRALIZATION: "FTS_CENTRALIZATION",
  FTS_FUNCTION_NAME: "FTS_FUNCTION_NAME",
  FTS_FUNCTION_STEP: "FTS_FUNCTION_STEP",
  FTS_FUNCTION_CATEGORY: "FTS_FUNCTION_CATEGORY",
  FTS_FUNCTION_MARKER: "FTS_FUNCTION_MARKER",
  FTS_FUNCTION_COMPLEXITY: "FTS_FUNCTION_COMPLEXITY",
  FTS_FUNCTION_EXECUTION_FREQUENCY: "FTS_FUNCTION_EXECUTION_FREQUENCY",
  WHO_PERFORMS_ACTION: "WHO_PERFORMS_ACTION",
  FTS_FUNCTION_ACTION_TYPE: "FTS_FUNCTION_ACTION_TYPE",
  FTS_FUNCTION_EFFECTIVENESS: "FTS_FUNCTION_EFFECTIVENESS",
  FTS_COMPETENCY_CENTER: "FTS_COMPETENCY_CENTER",
  FTS_DTI: "FTS_DTI",
  FTS_FUNCTION_RELATION_TYPE: "FTS_FUNCTION_RELATION_TYPE"
};
var ActionHistoryType = {
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE"
};

// validation/regexes.ts
var TIN_REGEX = /^\d{10}$|^\d{12}$/;
var CRR_REGEX = /^\d{9}$/;
var PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).+$/;
var LOGIN_REGEX = /^[a-zA-Z0-9_-]+$/;
var NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s]+$/;
var PHONE_REGEX = /^[\d\s]+$/;
var LOTUS_REGEX_2 = /^[^\/]+\/[^\/]+\/[^\/]+$/;
var LOTUS_REGEX_3 = /^[^\/]+\/[^\/]+\/[^\/]+\/[^\/]+$/;

// validation/limits.ts
var TITLE_MAX_LENGTH = 100;
var MIN_DATE = /* @__PURE__ */ new Date("1900-01-01T00:00:00.000Z");
var MAX_DATE = /* @__PURE__ */ new Date("9999-12-31T23:59:59.999Z");

// colors/presets.ts
var COLOR_PRESETS = [
  "#34d399",
  "#fb7185",
  "#ef4444",
  "#fbbf24",
  "#60a5fa",
  "#a78bfa",
  "#818cf8",
  "#2dd4bf",
  "#7dd3fc",
  "#38bdf8",
  "#94a3b8"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionHistoryType,
  COLOR_PRESETS,
  CRR_REGEX,
  Category,
  ErrorCode,
  FtsBranchType,
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
  FtsFunctionRelationType,
  FtsFunctionRole,
  FtsFunctionStep,
  FtsPositionRole,
  LOGIN_REGEX,
  LOTUS_REGEX_2,
  LOTUS_REGEX_3,
  MAX_DATE,
  MIN_DATE,
  NAME_REGEX,
  PASSWORD_REGEX,
  PHONE_REGEX,
  TIN_REGEX,
  TITLE_MAX_LENGTH,
  UserRole
});
