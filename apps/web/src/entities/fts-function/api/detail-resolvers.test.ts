import type { Row } from "src/entities/fts-function/types";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import {
  buildDetailInputFromRow,
  resolveDetailDto,
} from "src/entities/fts-function/api/detail-resolvers";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

const t = (
  id: number,
  code: string,
  category: TypeResponseDto["category"],
): TypeResponseDto => ({
  id,
  code,
  name: code,
  description: null,
  supertypeId: null,
  category,
});

const types: TypeResponseDto[] = [
  t(1, FtsFunctionStep.OBJECT_SELECTION, "FTS_FUNCTION_STEP"),
  t(2, FtsFunctionCategory.METHODOLOGY, "FTS_FUNCTION_CATEGORY"),
  t(3, FtsFunctionActionType.KEEP, "FTS_FUNCTION_ACTION_TYPE"),
  t(4, FtsFunctionComplexity.MIDDLE, "FTS_FUNCTION_COMPLEXITY"),
  t(5, FtsFunctionExecutionFrequency.DAILY, "FTS_FUNCTION_EXECUTION_FREQUENCY"),
];

const baseInput = {
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  actionLabel: FtsFunctionActionType.KEEP,
  periodicity: FtsFunctionExecutionFrequency.DAILY,
  complexity: FtsFunctionComplexity.MIDDLE,
  detailText: "do x",
  who: "  alice  ",
  artifact: "",
  basis: "  ",
  artifactUsage: "art",
  purpose: "to win",
} as const;

describe("resolveDetailDto", () => {
  it("returns null when actionLabel is the empty string", () => {
    expect(
      resolveDetailDto({ ...baseInput, actionLabel: "" }, types),
    ).toBeNull();
  });

  it("returns null when any required dictionary id is missing", () => {
    // No types passed → every findTypeIdByCode returns undefined.
    expect(resolveDetailDto(baseInput, undefined)).toBeNull();
    expect(resolveDetailDto(baseInput, [])).toBeNull();
  });

  it("trims optional fields and collapses whitespace to null", () => {
    const dto = resolveDetailDto(baseInput, types);
    expect(dto).not.toBeNull();
    // `who` is no longer carried on the persisted DTO — see detail-resolvers
    // comment. The form-side `who` is still preserved on the UI Row.
    expect(dto!.artifact).toBeNull();
    expect(dto!.basis).toBeNull();
    expect(dto!.artifactUsage).toBe("art");
    expect(dto!.purpose).toBe("to win");
  });

  it("resolves enum fields to dictionary ids", () => {
    const dto = resolveDetailDto(baseInput, types);
    expect(dto!.ftsFunctionStepId).toBe(1);
    expect(dto!.ftsFunctionCategoryId).toBe(2);
    expect(dto!.ftsFunctionActionTypeId).toBe(3);
    expect(dto!.ftsFunctionComplexityId).toBe(4);
    expect(dto!.ftsFunctionExecutionFrequencyId).toBe(5);
  });

  it("persists complexity / periodicity as null when the user left them empty", () => {
    const dto = resolveDetailDto(
      { ...baseInput, complexity: "", periodicity: "" },
      types,
    );
    expect(dto).not.toBeNull();
    expect(dto!.ftsFunctionComplexityId).toBeNull();
    expect(dto!.ftsFunctionExecutionFrequencyId).toBeNull();
  });

  it("returns null when the user picked a complexity but the dictionary lookup fails", () => {
    // User selected an enum value, but `types` doesn't contain a matching code.
    // The resolver must wait (return null) so the snackbar fires — *not* persist.
    const partialTypes = types.filter(
      (x) => x.category !== "FTS_FUNCTION_COMPLEXITY",
    );
    const dto = resolveDetailDto(baseInput, partialTypes);
    expect(dto).toBeNull();
  });
});

describe("buildDetailInputFromRow", () => {
  const row: Row = {
    id: "1",
    step: FtsFunctionStep.OBJECT_SELECTION,
    category: FtsFunctionCategory.METHODOLOGY,
    detailText: "x",
    actionLabel: FtsFunctionActionType.KEEP,
    periodicity: FtsFunctionExecutionFrequency.DAILY,
    complexity: FtsFunctionComplexity.MIDDLE,
    who: "alice",
  };

  it("merges row fields with the partial updates", () => {
    const out = buildDetailInputFromRow(row, { detailText: "y" });
    expect(out.detailText).toBe("y");
    expect(out.who).toBe("alice"); // preserved from row
  });

  it("preserves enum fields verbatim from the existing row", () => {
    const out = buildDetailInputFromRow(row, {});
    expect(out.step).toBe(FtsFunctionStep.OBJECT_SELECTION);
    expect(out.category).toBe(FtsFunctionCategory.METHODOLOGY);
    expect(out.actionLabel).toBe(FtsFunctionActionType.KEEP);
  });
});
