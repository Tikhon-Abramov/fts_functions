// Canonical domain codes live one-per-file under `./model`. Row stores the
// backend code verbatim; display strings are resolved via i18n at render time.
import type { FtsFunctionActionType } from "./model/fts-function-action-type";
import type { FtsFunctionCategory } from "./model/fts-function-category";
import type { FtsFunctionComplexity } from "./model/fts-function-complexity";
import type { FtsFunctionExecutionFrequency } from "./model/fts-function-execution-frequency";
import type { FtsFunctionRelationType } from "./model/fts-function-relation-type";
import type { FtsFunctionStep } from "./model/fts-function-step";

export type Row = {
  id: string;
  step: FtsFunctionStep;
  category: FtsFunctionCategory;
  detailText: string;
  who?: string | undefined;
  /**
   * Backend code from FtsFunctionActionType. Empty string means "not set"
   * (rare — every persisted row has an action). Rename to `action` in a
   * follow-up once callsites settle.
   */
  actionLabel: FtsFunctionActionType | "";
  periodicity?: FtsFunctionExecutionFrequency | "" | undefined;
  complexity?: FtsFunctionComplexity | "" | undefined;
  artifact?: string | undefined;
  basis?: string | undefined;
  artifactUsage?: string | undefined;
  purpose?: string | undefined;
};

export type Link = {
  id: string;
  fromId: string;
  toId: string;
  kind: FtsFunctionRelationType;
  note?: string | undefined;
};

export type FunctionDetails = {
  rows: Row[];
  links: Link[];
};

export type FunctionRecord = {
  // Backend `FtsFunction.id` is a numeric PK. Keeping this as `number` so the
  // DataGrid `type: "number"` ID column and its numeric filter operators
  // (=, !=, >, >=, <, <=, isAnyOf) work without per-row coercion.
  id: number;
  name: string;
  marker: string;
  centralization: string;
  competenceCenter: string;
  strategyProjects: string[];
  curatorCA: string;
  nuZnu: string;
  managerMiudol: string;
  niZni: string;
  details?: FunctionDetails | undefined;
};

// ---- deprecated display-name aliases ----
// Kept as aliases of the backend-code types so incremental callsites still
// compile; prefer the `FtsFunction*` names from `./model` going forward.
/** @deprecated use `FtsFunctionCategory` from `./model`. */
export type Category = FtsFunctionCategory;
/** @deprecated use `FtsFunctionActionType` from `./model` (nullable via ""). */
export type ActionLabel = FtsFunctionActionType | "";
/** @deprecated use `FtsFunctionRelationType` from `./model`. */
export type LinkKind = FtsFunctionRelationType;
/** @deprecated use `FtsFunctionExecutionFrequency` from `./model`. */
export type Periodicity = FtsFunctionExecutionFrequency | "";
/** @deprecated use `FtsFunctionComplexity` from `./model`. */
export type Complexity = FtsFunctionComplexity | "";
