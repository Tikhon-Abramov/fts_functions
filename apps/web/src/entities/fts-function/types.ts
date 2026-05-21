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
   * Type.code из справочника TECHNOLOGICAL_SOLUTION.
   */
  technologicalSolution?: string;

  /**
   * Номер ПЗ / АЗ.
   */
  number?: string;

  /**
   * Type.name из справочника RESPONSIBLE.
   */
  responsible?: string;

  /**
   * Алгоритм срабатывания.
   */
  algorithm?: string;
};

export type Link = {
  id: string;
  fromId: string;
  toId: string;
  kind: FtsFunctionRelationType;
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