import type {
  FunctionRecord,
  Link,
  Row,
} from "src/entities/fts-function/types";
import type {
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

// Reverse lookups for dictionaries. Build lookup maps once per render pass.
//
// `typesById` already carries the full TypeResponseDto, which now includes
// `color?: string | null`. Components consuming colored chips look up the
// Type by id (or by code via `typesByCode` / `colorByCode`) and pass
// `type.color` to `<TypeChip>`.
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
  types?.forEach((t) => {
    typesById.set(t.id, t);
    typesByCode.set(t.code, t);
    colorByCode.set(t.code, t.color);
  });
  const usersById = new Map<number, UserResponseDto>();
  users?.forEach((u) => usersById.set(u.id, u));
  return { typesById, typesByCode, colorByCode, usersById };
}

// Finds the first type with a given `code` inside a list. Useful for mapping
// UI-canonical codes back to backend ids during mutation submission.
export function findTypeIdByCode(
  types: TypeResponseDto[] | undefined,
  code: string,
): number | undefined {
  return types?.find((t) => t.code === code)?.id;
}

// Resolve display name for a code via DB `Type.name`. Returns the code as
// fallback if dictionary missing — keeps the UI sane during dictionary load.
export function findTypeNameByCode(
  types: TypeResponseDto[] | undefined,
  code: string,
): string {
  return types?.find((t) => t.code === code)?.name ?? code;
}

// ---------------- code narrowing helpers ----------------
//
// Row fields store backend codes verbatim. These helpers narrow an incoming
// `string` to a union code when the backend payload matches a known code;
// unknown codes return `null` so callers can fall back / skip the row.

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
  const u = lookup.usersById.get(id);
  return u?.shortName ?? u?.fullName ?? "";
}

// Maps a list-item (bare IDs) + constants lookup to the UI FunctionRecord.
// Omits `details` — detail rows are loaded lazily via the byId endpoint.
export function mapFtsFunctionApiToFunctionRecord(
  apiFn: FtsFunctionControllerListV1ApiResponse["items"][number],
  lookup: ConstantsLookup,
): FunctionRecord {
  return {
    id: apiFn.id,
    name: typeName(lookup, apiFn.ftsFunctionNameId),
    marker: typeName(lookup, apiFn.ftsFunctionMarkerId),
    centralization: typeName(lookup, apiFn.ftsCentralizationId),
    competenceCenter: typeName(lookup, apiFn.competencyCenterId),
    strategyProjects: apiFn.dtis?.map((d) => d.dti.name) ?? [],
    curatorCA: userName(lookup, apiFn.curatorCentralOfficeId),
    nuZnu: userName(lookup, apiFn.departmentHeadCentralOfficeId),
    managerMiudol: userName(lookup, apiFn.managerInterregionalInspectionId),
    niZni: userName(lookup, apiFn.departmentHeadInterregionalInspectionId),
  };
}

// ---------------- Detail mapping (single FtsFunction detailed response) ----------------

type DetailItem = FtsFunctionDetailedResponseDto["ftsFunctionDetails"][number];

/**
 * Map one API detail row to a UI `Row`. Returns `null` when a required enum
 * code is unrecognised — caller filters those out. Enum fields pass through
 * as backend codes (no translation).
 */
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
  };
}

// Derives Link[] by walking every detail's `parents` edges. Each edge becomes
// a single Link; `children` edges are the same records mirrored from the
// other side, so we skip those to avoid duplicates. Edges whose relation type
// is unknown are dropped.
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
