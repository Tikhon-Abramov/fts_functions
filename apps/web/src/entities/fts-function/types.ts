import type {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
  FtsFunctionRelationType,
  FtsFunctionStep,
} from "./model";

export type FeedbackAgreementStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type FeedbackAgreementHistoryItem = {
  id: string;
  fromStatus: FeedbackAgreementStatus | null;
  toStatus: FeedbackAgreementStatus;
  comment?: string;
  createdAt?: string;
};

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

  technologicalSolution?: string;
  number?: string;
  responsible?: string;
  algorithm?: string;

  feedbackSource?: string;
  feedbackQualityMetric?: string;
  problemDescription?: string;
  initiatorRequisites?: string;
  methodologyPosition?: string;
  deadline?: string;
  initiatorAcceptance?: string;
  isAccepted?: boolean | null;
  rejectComment?: string;

  feedbackAgreementHistory?: FeedbackAgreementHistoryItem[];
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