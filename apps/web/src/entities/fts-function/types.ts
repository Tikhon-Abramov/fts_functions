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
  feedbackId: string;
  fromStatus: FeedbackAgreementStatus | null;
  toStatus: FeedbackAgreementStatus;
  comment?: string;
  createdAt?: string;
};

/**
 * Отдельная обратная связь по строке детализации (FtsFunctionDetail).
 * Соответствует модели Feedback в Prisma-схеме.
 */
export type Feedback = {
  /** id записи Feedback (нужен для update / delete / accept) */
  id: string;
  /** id строки детализации, к которой привязана обратная связь */
  ftsFunctionDetailId: string;

  /** Набор источников обратной связи (FeedbackToFeedbackSource) */
  feedbackSourceIds: string[];
  /** Метрика качества обратной связи */
  feedbackQualityMetricId?: string | null;
  /** Методологическая позиция ЦА ФНС России из справочника */
  ftsMethodologyStatusId?: string | null;

  problemDescription?: string;
  initiatorRequisites?: string;
  initiatorAcceptance?: string;
  deadline?: string;

  /** Статус согласования: null = на согласовании */
  isAccepted?: boolean | null;

  history: FeedbackAgreementHistoryItem[];
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

  /** Обратные связи по строке (у одной детализации их может быть несколько) */
  feedbacks: Feedback[];
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