import type {
  Feedback,
  FeedbackAgreementStatus,
  FunctionRecord,
  Link,
  Row,
} from "src/entities/fts-function/types";
import type {
  FeedbackResponseDto,
  FtsFunctionControllerListV1ApiResponse,
  FtsFunctionDetailedResponseDto,
  TypeResponseDto,
  UserResponseDto,
} from "src/shared/api/ftsFunctionsApi";

import { FtsFunctionActionType } from "src/entities/fts-function/model/fts-function-action-type";
import { FtsFunctionCategory } from "src/entities/fts-function/model/fts-function-category";
import { FtsFunctionComplexity } from "src/entities/fts-function/model/fts-function-complexity";
import { FtsFunctionExecutionFrequency } from "src/entities/fts-function/model/fts-function-execution-frequency";
import { FtsFunctionRelationType } from "src/entities/fts-function/model/fts-function-relation-type";
import { FtsFunctionStep } from "src/entities/fts-function/model/fts-function-step";

export type ConstantsLookup = {
  typesById: Map<number, TypeResponseDto>;
  typesByCode: Map<string, TypeResponseDto>;
  colorByCode: Map<string, string | null | undefined>;
  usersById: Map<number, UserResponseDto>;
};

export function buildConstantsLookup(
    types: TypeResponseDto[] | undefined,
    users: UserResponseDto[] | undefined,
): ConstantsLookup {
  const typesById = new Map<number, TypeResponseDto>();
  const typesByCode = new Map<string, TypeResponseDto>();
  const colorByCode = new Map<string, string | null | undefined>();

  types?.forEach((type) => {
    typesById.set(type.id, type);
    typesByCode.set(type.code, type);
    colorByCode.set(type.code, type.color);
  });

  const usersById = new Map<number, UserResponseDto>();

  users?.forEach((user) => {
    usersById.set(user.id, user);
  });

  return { typesById, typesByCode, colorByCode, usersById };
}

export function findTypeIdByCode(
    types: TypeResponseDto[] | undefined,
    code: string,
): number | undefined {
  return types?.find((type) => type.code === code)?.id;
}

export function findTypeNameByCode(
    types: TypeResponseDto[] | undefined,
    code: string,
): string {
  return types?.find((type) => type.code === code)?.name ?? code;
}

function asStep(code: string | undefined | null): FtsFunctionStep | null {
  return code && code in FtsFunctionStep ? (code as FtsFunctionStep) : null;
}

function asCategory(
    code: string | undefined | null,
): FtsFunctionCategory | null {
  return code && code in FtsFunctionCategory
      ? (code as FtsFunctionCategory)
      : null;
}

function asAction(
    code: string | undefined | null,
): FtsFunctionActionType | null {
  return code && code in FtsFunctionActionType
      ? (code as FtsFunctionActionType)
      : null;
}

function asComplexity(
    code: string | undefined | null,
): FtsFunctionComplexity | null {
  return code && code in FtsFunctionComplexity
      ? (code as FtsFunctionComplexity)
      : null;
}

function asFrequency(
    code: string | undefined | null,
): FtsFunctionExecutionFrequency | null {
  return code && code in FtsFunctionExecutionFrequency
      ? (code as FtsFunctionExecutionFrequency)
      : null;
}

function asRelation(
    code: string | undefined | null,
): FtsFunctionRelationType | null {
  return code && code in FtsFunctionRelationType
      ? (code as FtsFunctionRelationType)
      : null;
}

function asFeedbackAgreementStatus(
    status: string | undefined | null,
): FeedbackAgreementStatus | null {
  if (status === "PENDING") return "PENDING";
  if (status === "ACCEPTED") return "ACCEPTED";
  if (status === "REJECTED") return "REJECTED";

  return null;
}

function typeName(
    lookup: ConstantsLookup,
    id: number | null | undefined,
): string {
  if (id == null) return "";

  return lookup.typesById.get(id)?.name ?? "";
}

function userName(
    lookup: ConstantsLookup,
    id: number | null | undefined,
): string {
  if (id == null) return "";

  const user = lookup.usersById.get(id);

  return user?.shortName ?? user?.fullName ?? "";
}

function toIsoString(value: string | Date | undefined | null): string {
  if (!value) return "";

  return value instanceof Date ? value.toISOString() : value;
}

function stringId(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  return String(value);
}

type DetailApi = FtsFunctionDetailedResponseDto["ftsFunctionDetails"][number];

type DetailFeedbackApi = NonNullable<DetailApi["feedbacks"]>[number];

type FeedbackApi = FeedbackResponseDto | DetailFeedbackApi;

type ApiFeedbackSource = {
  feedbackSource: {
    id: number | string;
  };
};

type ApiFeedbackHistoryItem = {
  id: number | string;
  feedbackId?: number | string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  comment?: string | null;
  createdAt?: string | Date | null;
};

export function mapFeedbackApiToFeedback(apiFeedback: FeedbackApi): Feedback {
  const feedbackSources = Array.isArray(apiFeedback.feedbackSources)
      ? (apiFeedback.feedbackSources as ApiFeedbackSource[])
      : [];

  const historyItems = Array.isArray(apiFeedback.feedbackAgreementHistory)
      ? (apiFeedback.feedbackAgreementHistory as ApiFeedbackHistoryItem[])
      : [];

  return {
    id: String(apiFeedback.id),
    ftsFunctionDetailId: String(apiFeedback.ftsFunctionDetailId),
    feedbackSourceIds: feedbackSources.map((item) =>
        String(item.feedbackSource.id),
    ),
    feedbackQualityMetricId: stringId(apiFeedback.feedbackQualityMetricsId),
    ftsMethodologyStatusId: stringId(apiFeedback.ftsMethodologyStatusId),
    problemDescription: apiFeedback.problemDescription ?? "",
    initiatorRequisites: apiFeedback.initiatorRequisites ?? "",
    initiatorAcceptance: apiFeedback.initiatorAcceptance ?? "",
    deadline: toIsoString(apiFeedback.deadline).slice(0, 10),
    isAccepted: apiFeedback.isAccepted ?? null,
    history: historyItems.map((item) => {
      const fromStatus = asFeedbackAgreementStatus(item.fromStatus);
      const toStatus = asFeedbackAgreementStatus(item.toStatus) ?? "PENDING";

      return {
        id: String(item.id),
        feedbackId: String(item.feedbackId ?? apiFeedback.id),
        fromStatus,
        toStatus,
        ...(item.comment ? { comment: item.comment } : {}),
        createdAt: toIsoString(item.createdAt),
      };
    }),
  };
}

export function mapFtsFunctionApiToFunctionRecord(
    apiFunction: FtsFunctionControllerListV1ApiResponse["items"][number],
    lookup: ConstantsLookup,
): FunctionRecord {
  return {
    id: apiFunction.id,
    name: typeName(lookup, apiFunction.ftsFunctionNameId),
    marker: typeName(lookup, apiFunction.ftsFunctionMarkerId),
    centralization: typeName(lookup, apiFunction.ftsCentralizationId),
    competenceCenter: typeName(lookup, apiFunction.competencyCenterId),
    strategyProjects: apiFunction.dtis?.map((dti) => dti.dti.name) ?? [],
    curatorCA: userName(lookup, apiFunction.curatorCentralOfficeId),
    nuZnu: userName(lookup, apiFunction.departmentHeadCentralOfficeId),
    managerMiudol: userName(lookup, apiFunction.managerInterregionalInspectionId),
    niZni: userName(
        lookup,
        apiFunction.departmentHeadInterregionalInspectionId,
    ),
  };
}

type DetailItem = FtsFunctionDetailedResponseDto["ftsFunctionDetails"][number];

export function mapFtsFunctionDetailApiToRow(detail: DetailItem): Row | null {
  const step = asStep(detail.ftsFunctionStep?.code);
  const category = asCategory(detail.ftsFunctionCategory?.code);
  const action = asAction(detail.ftsFunctionActionType?.code);

  if (step === null || category === null) return null;

  const frequency = asFrequency(detail.ftsFunctionExecutionFrequency?.code);
  const complexity = asComplexity(detail.ftsFunctionComplexity?.code);

  return {
    id: String(detail.id),
    step,
    category,
    detailText: detail.ftsFunctionDetails ?? "",
    who: detail.whoPerformsAction?.name ?? "",
    actionLabel: action ?? "",
    periodicity: frequency ?? "",
    complexity: complexity ?? "",
    artifact: detail.artifact ?? "",
    basis: detail.basis ?? "",
    artifactUsage: detail.artifactUsage ?? "",
    purpose: detail.purpose ?? "",
    technologicalSolution: detail.technologicalSolution?.code ?? "",
    number: detail.number ?? "",
    responsible: detail.responsible?.code ?? detail.responsible?.name ?? "",
    algorithm: detail.algorithm ?? "",
    feedbacks: detail.feedbacks?.map(mapFeedbackApiToFeedback) ?? [],
  };
}

export function mapFtsFunctionDetailsToLinks(
    details: FtsFunctionDetailedResponseDto["ftsFunctionDetails"],
): Link[] {
  const links: Link[] = [];
  const seen = new Set<string>();

  for (const detail of details) {
    for (const edge of detail.parents ?? []) {
      const key = `${edge.parentFtsFunctionId}-${edge.childFtsFunctionId}-${edge.relationTypeId}`;

      if (seen.has(key)) continue;

      seen.add(key);

      const kind = asRelation(edge.relationType?.code);

      if (kind === null) continue;

      links.push({
        id: key,
        fromId: String(edge.parentFtsFunctionId),
        toId: String(edge.childFtsFunctionId),
        kind,
      });
    }
  }

  return links;
}