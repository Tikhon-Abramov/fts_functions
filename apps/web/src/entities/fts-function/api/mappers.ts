import type {
  DetailAction,
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
  colorByCode: Map<string, string | undefined>;
  usersById: Map<number, UserResponseDto>;
};

export function buildConstantsLookup(
  types: TypeResponseDto[] | undefined,
  users: UserResponseDto[] | undefined,
): ConstantsLookup {
  const typesById = new Map<number, TypeResponseDto>();
  const typesByCode = new Map<string, TypeResponseDto>();
  const colorByCode = new Map<string, string | undefined>();

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

function optionalString(
  value: number | string | null | undefined,
): string | undefined {
  if (value === null || value === undefined) return undefined;

  return String(value);
}

function stringId(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  return String(value);
}

type DetailItem = FtsFunctionDetailedResponseDto["ftsFunctionDetails"][number];
type DetailFeedbackApi = NonNullable<DetailItem["feedbacks"]>[number];
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

type ApiActionSource = {
  feedbackSource?: {
    id?: number | string | null;
    code?: string | null;
    name?: string | null;
  } | null;
  feedbackSourceId?: number | string | null;
};

type ApiActionLike = {
  id?: number | string | null;
  ftsFunctionDetailId?: number | string | null;
  statusId?: number | string | null;
  description?: string | null;
  status?: {
    id?: number | string | null;
    code?: string | null;
    name?: string | null;
  } | null;
  feedbackSources?: ApiActionSource[] | null;
  feedbackQualityMetricsId?: number | string | null;
  feedbackQualityMetricId?: number | string | null;
  feedbackQualityMetrics?: {
    id?: number | string | null;
    code?: string | null;
    name?: string | null;
  } | null;
  ftsMethodologyStatusId?: number | string | null;
  ftsMethodologyStatus?: {
    id?: number | string | null;
    code?: string | null;
    name?: string | null;
  } | null;
  problemDescription?: string | null;
  initiatorRequisites?: string | null;
  deadline?: string | Date | null;
  initiatorAcceptance?: string | null;
};

type DetailItemExtra = DetailItem & {
  ftsFunctionActionType?: {
    id?: number | string | null;
    code?: string | null;
    name?: string | null;
  } | null;
  actionsEffectiveness?: string | null;
  actionsСompleteness?: string | null;
  actionsCompleteness?: string | null;
  actions?: unknown[] | null;
  feedbackSources?: Array<{
    feedbackSource?: {
      id?: number | string | null;
      code?: string | null;
      name?: string | null;
    } | null;
  }> | null;
  feedbackQualityMetrics?: {
    id?: number | string | null;
    code?: string | null;
    name?: string | null;
  } | null;
  problemDescription?: string | null;
  initiatorRequisites?: string | null;
  ftsMethodologyStatus?: {
    id?: number | string | null;
    code?: string | null;
    name?: string | null;
  } | null;
  methodologyPosition?: string | null;
  deadline?: string | Date | null;
  initiatorAcceptance?: string | null;
  isAccepted?: boolean | null;
  rejectComment?: string | null;
  feedbackAgreementHistory?: ApiFeedbackHistoryItem[] | null;
};

export function mapActionApiToDetailAction(
  apiAction: unknown,
  fallbackDetailId?: string,
): DetailAction {
  const action = apiAction as ApiActionLike;
  const statusId = action.statusId ?? action.status?.id ?? null;
  const detailId = optionalString(action.ftsFunctionDetailId) ?? fallbackDetailId;
  const feedbackQualityMetricId =
    action.feedbackQualityMetricsId ??
    action.feedbackQualityMetricId ??
    action.feedbackQualityMetrics?.id ??
    null;
  const ftsMethodologyStatusId =
    action.ftsMethodologyStatusId ??
    action.ftsMethodologyStatus?.id ??
    null;
  const feedbackSources = Array.isArray(action.feedbackSources)
    ? action.feedbackSources
    : [];

  return {
    id: String(action.id ?? ""),
    ...(detailId !== undefined ? { ftsFunctionDetailId: detailId } : {}),
    statusId:
      statusId === null || statusId === undefined ? null : String(statusId),
    statusCode: action.status?.code ?? "",
    statusName: action.status?.name ?? "",
    description: action.description ?? "",
    feedbackSourceIds: feedbackSources
      .map((item) => item.feedbackSource?.id ?? item.feedbackSourceId)
      .filter((id): id is number | string => id !== null && id !== undefined)
      .map(String),
    feedbackQualityMetricId:
      feedbackQualityMetricId === null || feedbackQualityMetricId === undefined
        ? null
        : String(feedbackQualityMetricId),
    feedbackQualityMetricName: action.feedbackQualityMetrics?.name ?? "",
    ftsMethodologyStatusId:
      ftsMethodologyStatusId === null || ftsMethodologyStatusId === undefined
        ? null
        : String(ftsMethodologyStatusId),
    ftsMethodologyStatusName: action.ftsMethodologyStatus?.name ?? "",
    problemDescription: action.problemDescription ?? "",
    initiatorRequisites: action.initiatorRequisites ?? "",
    deadline: toIsoString(action.deadline).slice(0, 10),
    initiatorAcceptance: action.initiatorAcceptance ?? "",
  };
}

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
    managerMiudol: userName(
      lookup,
      apiFunction.managerInterregionalInspectionId,
    ),
    niZni: userName(
      lookup,
      apiFunction.departmentHeadInterregionalInspectionId,
    ),
  };
}

export function mapFtsFunctionDetailApiToRow(detail: DetailItem): Row | null {
  const extra = detail as DetailItemExtra;
  const step = asStep(detail.ftsFunctionStep?.code);
  const category = asCategory(detail.ftsFunctionCategory?.code);
  const action = asAction(extra.ftsFunctionActionType?.code);

  if (step === null || category === null) return null;

  const frequency = asFrequency(detail.ftsFunctionExecutionFrequency?.code);
  const complexity = asComplexity(detail.ftsFunctionComplexity?.code);
  const actions = (extra.actions ?? [])
    .filter((item) => item !== null && item !== undefined)
    .map((item) => mapActionApiToDetailAction(item, String(detail.id)));
  const firstFeedback = detail.feedbacks?.[0];

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
    actionsСompleteness:
      extra.actionsCompleteness ?? extra.actionsСompleteness ?? "",
    actionsCompleteness:
      extra.actionsCompleteness ?? extra.actionsСompleteness ?? "",
    actionsEffectiveness: extra.actionsEffectiveness ?? "",
    technologicalSolution: detail.technologicalSolution?.code ?? "",
    number: detail.number ?? "",
    responsible: detail.responsible?.name ?? "",
    filePath: detail.filePath ?? "",
    algorithm: detail.algorithm ?? "",
    feedbackSource:
      extra.feedbackSources?.[0]?.feedbackSource?.code ??
      firstFeedback?.feedbackSources?.[0]?.feedbackSource?.code ??
      "",
    feedbackQualityMetric:
      extra.feedbackQualityMetrics?.code ??
      firstFeedback?.feedbackQualityMetrics?.code ??
      "",
    problemDescription:
      extra.problemDescription ?? firstFeedback?.problemDescription ?? "",
    initiatorRequisites:
      extra.initiatorRequisites ?? firstFeedback?.initiatorRequisites ?? "",
    methodologyPosition:
      extra.methodologyPosition ?? extra.ftsMethodologyStatus?.name ?? "",
    deadline:
      toIsoString(extra.deadline).slice(0, 10) ||
      toIsoString(firstFeedback?.deadline).slice(0, 10),
    initiatorAcceptance:
      extra.initiatorAcceptance ?? firstFeedback?.initiatorAcceptance ?? "",
    isAccepted: extra.isAccepted ?? firstFeedback?.isAccepted ?? null,
    rejectComment: extra.rejectComment ?? "",
    feedbackAgreementHistory:
      extra.feedbackAgreementHistory?.map((item) => ({
        id: String(item.id),
        feedbackId: String(item.feedbackId ?? ""),
        fromStatus: asFeedbackAgreementStatus(item.fromStatus),
        toStatus: asFeedbackAgreementStatus(item.toStatus) ?? "PENDING",
        ...(item.comment ? { comment: item.comment } : {}),
        createdAt: toIsoString(item.createdAt),
      })) ?? [],
    feedbacks: detail.feedbacks?.map(mapFeedbackApiToFeedback) ?? [],
    actions,
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
