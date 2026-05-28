/**
 * Regression tests for the AddItemForm schema helpers. The
 * `isStepFilled(undefined)` case is the one that crashed the modal on mount
 * tonight — `useWatch` briefly returns `undefined` for nested object fields
 * before RHF defaults propagate, and the old `s.detailText.trim()` form
 * threw "Cannot read properties of undefined (reading 'trim')". Keep the
 * `(undefined)` / `({})` / `({ detailText: "" })` cases red-line forever.
 */
import {
  emptyStep,
  fieldsToData,
  isStepFilled,
  type StepFields,
} from "src/components/AddItemForm/lib/schema";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

describe("emptyStep", () => {
  it("returns a fresh object every call", () => {
    const a = emptyStep();
    const b = emptyStep();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });

  it("seeds enum-correct defaults that match the zod schema", () => {
    const e = emptyStep();
    expect(e.category).toBe(FtsFunctionCategory.METHODOLOGY);
    expect(e.actionLabel).toBe(FtsFunctionActionType.KEEP);
    expect(e.periodicity).toBe(FtsFunctionExecutionFrequency.DAILY);
    expect(e.complexity).toBe(FtsFunctionComplexity.MIDDLE);
  });

  it("leaves every free-form text field as the empty string", () => {
    const e = emptyStep();
    for (const key of [
      "detailText",
      "who",
      "artifact",
      "basis",
      "artifactUsage",
      "purpose",
    ] as const) {
      expect(e[key]).toBe("");
    }
  });
});

describe("isStepFilled — REGRESSION: AddItemForm mount-window crash", () => {
  it("returns false when the step is undefined (RHF mount race)", () => {
    expect(isStepFilled(undefined)).toBe(false);
  });

  it("returns false for an empty object literal", () => {
    expect(isStepFilled({} as unknown as StepFields)).toBe(false);
  });

  it("returns false when detailText is missing", () => {
    const partial = { ...emptyStep(), detailText: "" } as StepFields;
    expect(isStepFilled(partial)).toBe(false);
  });

  it("returns false for whitespace-only detailText", () => {
    const partial = { ...emptyStep(), detailText: "   \t " };
    expect(isStepFilled(partial)).toBe(false);
  });

  it("returns true once detailText has any visible content", () => {
    const partial = { ...emptyStep(), detailText: "x" };
    expect(isStepFilled(partial)).toBe(true);
  });

  it("returns true for content padded with whitespace", () => {
    const partial = { ...emptyStep(), detailText: "  hello  " };
    expect(isStepFilled(partial)).toBe(true);
  });
});

describe("fieldsToData", () => {
  it("trims detailText and required text fields", () => {
    const out = fieldsToData({
      ...emptyStep(),
      detailText: "  do the thing  ",
      who: "  alice  ",
    });
    expect(out.detailText).toBe("do the thing");
    expect(out.who).toBe("alice");
  });

  it("collapses whitespace-only optional fields to undefined", () => {
    const out = fieldsToData({
      ...emptyStep(),
      detailText: "x",
      who: "   ",
      artifact: "",
      basis: "\t",
      artifactUsage: "  ",
      purpose: "",
    });
    expect(out.who).toBeUndefined();
    expect(out.artifact).toBeUndefined();
    expect(out.basis).toBeUndefined();
    expect(out.artifactUsage).toBeUndefined();
    expect(out.purpose).toBeUndefined();
  });

  it("preserves enum codes verbatim", () => {
    const out = fieldsToData({
      ...emptyStep(),
      detailText: "x",
      category: FtsFunctionCategory.CONTROL_ANALYTICS,
      actionLabel: FtsFunctionActionType.OPTIMIZE_TRANSFER,
      periodicity: FtsFunctionExecutionFrequency.MONTHLY,
      complexity: FtsFunctionComplexity.HARD,
    });
    expect(out.category).toBe(FtsFunctionCategory.CONTROL_ANALYTICS);
    expect(out.actionLabel).toBe(FtsFunctionActionType.OPTIMIZE_TRANSFER);
    expect(out.periodicity).toBe(FtsFunctionExecutionFrequency.MONTHLY);
    expect(out.complexity).toBe(FtsFunctionComplexity.HARD);
  });
});
