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

export {
  FtsFunctionCategory,
  FtsFunctionStep,
  FtsFunctionActionType,
  FtsFunctionExecutionFrequency,
  FtsFunctionComplexity,
  FtsFunctionRelationType,
  UserRole,
  FtsPositionRole,
  FtsFunctionRole,
  FtsBranchType,
  Category,
  ActionHistoryType
};
