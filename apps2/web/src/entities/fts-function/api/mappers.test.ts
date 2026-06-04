import type {
  FtsFunctionDetailedResponseDto,
  FtsFunctionListResponseDto,
  TypeResponseDto,
  UserResponseDto,
} from "src/shared/api/ftsFunctionsApi";

import {
  buildConstantsLookup,
  findTypeIdByCode,
  mapFtsFunctionApiToFunctionRecord,
  mapFtsFunctionDetailApiToRow,
  mapFtsFunctionDetailsToLinks,
} from "src/entities/fts-function/api/mappers";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionRelationType,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

const types: TypeResponseDto[] = [
  {
    id: 1,
    code: "NAME_A",
    name: "Имя А",
    description: null,
    supertypeId: null,
    category: "FTS_FUNCTION_NAME",
  },
  {
    id: 2,
    code: "MARKER_A",
    name: "Маркер А",
    description: null,
    supertypeId: null,
    category: "FTS_FUNCTION_MARKER",
  },
  {
    id: 3,
    code: FtsFunctionStep.OBJECT_SELECTION,
    name: "Шаг 1",
    description: null,
    supertypeId: null,
    category: "FTS_FUNCTION_STEP",
  },
  {
    id: 4,
    code: FtsFunctionCategory.METHODOLOGY,
    name: "Методология",
    description: null,
    supertypeId: null,
    category: "FTS_FUNCTION_CATEGORY",
  },
];

const users: UserResponseDto[] = [
  {
    id: 11,
    firstName: "I",
    lastName: "A",
    patronymic: null,
    fullName: "I A",
    shortName: "I.A.",
    description: null,
    role: "USER",
    ftsPositionRole: null,
    ftsFunctionRole: "CURATOR",
    ftsBranchType: "CENTRAL_OFFICE",
  },
];

describe("buildConstantsLookup", () => {
  it("indexes types by id, code, and color-by-code in one pass", () => {
    const lookup = buildConstantsLookup(types, users);
    expect(lookup.typesById.get(1)?.name).toBe("Имя А");
    expect(lookup.typesByCode.get("MARKER_A")?.id).toBe(2);
    expect(lookup.usersById.get(11)?.shortName).toBe("I.A.");
  });

  it("survives undefined inputs", () => {
    const lookup = buildConstantsLookup(undefined, undefined);
    expect(lookup.typesById.size).toBe(0);
    expect(lookup.usersById.size).toBe(0);
  });
});

describe("findTypeIdByCode", () => {
  it("returns the matching id", () => {
    expect(findTypeIdByCode(types, "NAME_A")).toBe(1);
  });
  it("returns undefined when no match", () => {
    expect(findTypeIdByCode(types, "NOPE")).toBeUndefined();
  });
  it("returns undefined when types is undefined", () => {
    expect(findTypeIdByCode(undefined, "NAME_A")).toBeUndefined();
  });
});

describe("mapFtsFunctionApiToFunctionRecord", () => {
  const lookup = buildConstantsLookup(types, users);
  const apiFn: FtsFunctionListResponseDto["items"][number] = {
    id: 100,
    ftsCentralizationId: 99,
    ftsFunctionNameId: 1,
    competencyCenterId: 99,
    ftsFunctionMarkerId: 2,
    curatorCentralOfficeId: 11,
    managerInterregionalInspectionId: 99,
    departmentHeadCentralOfficeId: 99,
    departmentHeadInterregionalInspectionId: 99,
    createdAt: "",
    updatedAt: "",
    isDeleted: false,
    deletedAt: null,
  };

  it("resolves type names through the lookup", () => {
    const r = mapFtsFunctionApiToFunctionRecord(apiFn, lookup);
    expect(r.id).toBe(100);
    expect(r.name).toBe("Имя А");
    expect(r.marker).toBe("Маркер А");
    expect(r.curatorCA).toBe("I.A.");
  });

  it("returns empty strings for ids not in the lookup", () => {
    const r = mapFtsFunctionApiToFunctionRecord(apiFn, lookup);
    expect(r.centralization).toBe("");
    expect(r.competenceCenter).toBe("");
    expect(r.nuZnu).toBe("");
  });
});

describe("mapFtsFunctionDetailApiToRow", () => {
  const baseDetail = {
    id: 1,
    ftsFunctionStep: { id: 1, code: FtsFunctionStep.OBJECT_SELECTION },
    ftsFunctionCategory: { id: 1, code: FtsFunctionCategory.METHODOLOGY },
    ftsFunctionActionType: { id: 1, code: FtsFunctionActionType.KEEP },
    ftsFunctionExecutionFrequency: null,
    ftsFunctionComplexity: null,
    whoPerformsAction: { id: 1, code: "ANY", name: "alice" },
    ftsFunctionEffectiveness: null,
    ftsFunctionDetails: "do it",
    artifact: null,
    basis: null,
    artifactUsage: null,
    purpose: null,
    parents: [],
    children: [],
  } as unknown as FtsFunctionDetailedResponseDto["ftsFunctionDetails"][number];

  it("happy path round-trips text + enums", () => {
    const r = mapFtsFunctionDetailApiToRow(baseDetail);
    expect(r).not.toBeNull();
    expect(r!.id).toBe("1");
    expect(r!.step).toBe(FtsFunctionStep.OBJECT_SELECTION);
    expect(r!.category).toBe(FtsFunctionCategory.METHODOLOGY);
    expect(r!.detailText).toBe("do it");
    expect(r!.who).toBe("alice");
    expect(r!.actionLabel).toBe(FtsFunctionActionType.KEEP);
  });

  it("returns null when the step code is unknown", () => {
    const bad = {
      ...baseDetail,
      ftsFunctionStep: { id: 1, code: "MYSTERY" },
    } as unknown as typeof baseDetail;
    expect(mapFtsFunctionDetailApiToRow(bad)).toBeNull();
  });

  it("falls back to empty strings for nullish text fields", () => {
    const detail = {
      ...baseDetail,
      ftsFunctionDetails: null,
      whoPerformsAction: null,
    } as unknown as typeof baseDetail;
    const r = mapFtsFunctionDetailApiToRow(detail);
    expect(r!.detailText).toBe("");
    expect(r!.who).toBe("");
  });
});

describe("mapFtsFunctionDetailsToLinks", () => {
  it("dedupes parent edges and skips unknown relation types", () => {
    const details = [
      {
        id: 1,
        parents: [
          {
            parentFtsFunctionId: 1,
            childFtsFunctionId: 2,
            relationTypeId: 100,
            relationType: { id: 100, code: FtsFunctionRelationType.CONNECTED },
          },
          {
            parentFtsFunctionId: 1,
            childFtsFunctionId: 2,
            relationTypeId: 100,
            relationType: { id: 100, code: FtsFunctionRelationType.CONNECTED },
          },
          {
            parentFtsFunctionId: 1,
            childFtsFunctionId: 3,
            relationTypeId: 200,
            relationType: { id: 200, code: "UNKNOWN" },
          },
        ],
      },
    ] as unknown as FtsFunctionDetailedResponseDto["ftsFunctionDetails"];
    const links = mapFtsFunctionDetailsToLinks(details);
    expect(links).toHaveLength(1);
    expect(links[0].kind).toBe(FtsFunctionRelationType.CONNECTED);
  });

  it("returns an empty array when details is empty", () => {
    expect(mapFtsFunctionDetailsToLinks([])).toEqual([]);
  });
});
