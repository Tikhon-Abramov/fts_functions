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
  feedbackId?: string;
  fromStatus: FeedbackAgreementStatus | null;
  toStatus: FeedbackAgreementStatus;
  comment?: string;
  createdAt?: string;
};

export type Feedback = {
  id: string;
  ftsFunctionDetailId: string;
  feedbackSourceIds: string[];
  feedbackQualityMetricId?: string | null;
  ftsMethodologyStatusId?: string | null;
  problemDescription?: string;
  initiatorRequisites?: string;
  initiatorAcceptance?: string;
  deadline?: string;
  isAccepted?: boolean | null;
  history: FeedbackAgreementHistoryItem[];
};

export type FeedbackFormInput = {
  feedbackSourceIds: string[];
  feedbackQualityMetricId: string;
  ftsMethodologyStatusId: string;
  problemDescription: string;
  initiatorRequisites: string;
  deadline: string;
  initiatorAcceptance: string;
};

export type DetailAction = {
  id: string;
  ftsFunctionDetailId?: string;
  statusId?: string | null;
  statusCode?: string;
  statusName?: string;
  description: string;

  feedbackSourceIds: string[];
  feedbackQualityMetricId?: string | null;
  feedbackQualityMetricName?: string;

  ftsMethodologyStatusId?: string | null;
  ftsMethodologyStatusName?: string;

  problemDescription?: string;
  initiatorRequisites?: string;
  deadline?: string;
  initiatorAcceptance?: string;
};

export type DetailActionFormInput = {
  description: string;
  statusId: string;
};

export type DetailActionFeedbackFormInput = {
  feedbackSourceIds: string[];
  feedbackQualityMetricId: string;
  ftsMethodologyStatusId: string;
  problemDescription: string;
  initiatorRequisites: string;
  deadline: string;
  initiatorAcceptance: string;
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
  actionsСompleteness?: string;
  actionsCompleteness?: string;
  actionsEffectiveness?: string;
  technologicalSolution?: string;
  number?: string;
  responsible?: string;
  algorithm?: string;
  filePath?: string;

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

  feedbacks: Feedback[];
  actions: DetailAction[];
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
