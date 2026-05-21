import type {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
  FtsFunctionRelationType,
  FtsFunctionStep,
} from "./model";

export type Row = {
  id: string;
  step: FtsFunctionStep;
  category: FtsFunctionCategory;
  detailText: string;
  who?: string;
  actionLabel: FtsFunctionActionType | "";
  periodicity?: FtsFunctionExecutionFrequency | "";
  complexity?: FtsFunctionComplexity | "";
  artifact?: string;
  basis?: string;
  artifactUsage?: string;
  purpose?: string;

  /**
   * DB type.code from Category.TECHNOLOGICAL_SOLUTION.
   * Label is resolved through `findTypeNameByCode(typesAll, value)`.
   */
  technologicalSolution?: string;

  /**
   * Номер ПЗ / АЗ.
   */
  number?: string;

  /**
   * Type.name from Category.RESPONSIBLE.
   */
  responsible?: string;

  /**
   * Алгоритм срабатывания.
   */
  algorithm?: string;
};

export type Link = {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: FtsFunctionRelationType;
};

export type FunctionRecord = {
  id: string | number;
  name: string;
  marker?: string;
  centralization?: string;
  competenceCenter?: string;
  strategyProjects?: string[];
  curatorCA?: string;
  nuZnu?: string;
  managerMiudol?: string;
  niZni?: string;
  rows?: Row[];
  links?: Link[];
};