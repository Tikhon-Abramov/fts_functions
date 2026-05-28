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

// enums/index.ts
var enums_exports = {};
__export(enums_exports, {
  ActionHistoryType: () => ActionHistoryType,
  Category: () => Category,
  FtsBranchType: () => FtsBranchType,
  FtsFunctionActionType: () => FtsFunctionActionType,
  FtsFunctionCategory: () => FtsFunctionCategory,
  FtsFunctionComplexity: () => FtsFunctionComplexity,
  FtsFunctionExecutionFrequency: () => FtsFunctionExecutionFrequency,
  FtsFunctionRelationType: () => FtsFunctionRelationType,
  FtsFunctionRole: () => FtsFunctionRole,
  FtsFunctionStep: () => FtsFunctionStep,
  FtsPositionRole: () => FtsPositionRole,
  UserRole: () => UserRole
});
module.exports = __toCommonJS(enums_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ActionHistoryType,
  Category,
  FtsBranchType,
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
  FtsFunctionRelationType,
  FtsFunctionRole,
  FtsFunctionStep,
  FtsPositionRole,
  UserRole
});
