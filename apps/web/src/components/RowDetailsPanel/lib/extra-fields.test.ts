import type { Row } from "src/entities/fts-function/types";

import {
  countFilled,
  EXTRA_FIELDS,
  FieldKind,
  PRIMARY_FIELDS,
} from "src/components/RowDetailsPanel/lib/extra-fields";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionComplexity,
  FtsFunctionExecutionFrequency,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

const baseRow: Row = {
  id: "1",
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: "x",
  actionLabel: FtsFunctionActionType.KEEP,
};

describe("EXTRA_FIELDS", () => {
  it("includes a config for every extra field key in the canonical order", () => {
    expect(EXTRA_FIELDS.map((f) => f.key)).toEqual([
      "who",
      "periodicity",
      "complexity",
      "artifact",
      "basis",
      "artifactUsage",
      "purpose",
    ]);
  });

  it("maps each select-code field to a non-empty options array", () => {
    const select = EXTRA_FIELDS.filter((f) => f.kind === FieldKind.SELECT_CODE);
    expect(select.length).toBeGreaterThan(0);
    for (const f of select) {
      expect(f.options).toBeDefined();
      expect(f.options!.length).toBeGreaterThan(0);
    }
  });
});

describe("PRIMARY_FIELDS", () => {
  it("exposes the editable primary detail-row fields in canonical order", () => {
    expect(PRIMARY_FIELDS.map((f) => f.key)).toEqual([
      "category",
      "detailText",
      "actionLabel",
    ]);
  });

  it("maps each select-code primary field to a non-empty options array", () => {
    const select = PRIMARY_FIELDS.filter(
      (f) => f.kind === FieldKind.SELECT_CODE,
    );
    expect(select.length).toBe(2);
    for (const f of select) {
      expect(f.options).toBeDefined();
      expect(f.options!.length).toBeGreaterThan(0);
    }
  });
});

describe("countFilled", () => {
  it("returns 0 when no extra fields are populated", () => {
    expect(countFilled(baseRow)).toBe(0);
  });

  it("treats whitespace-only strings as empty", () => {
    expect(countFilled({ ...baseRow, who: "   ", artifact: "\t" })).toBe(0);
  });

  it("counts each populated extra field once", () => {
    const r: Row = {
      ...baseRow,
      who: "Alice",
      artifact: "doc",
      periodicity: FtsFunctionExecutionFrequency.WEEKLY,
      complexity: FtsFunctionComplexity.SIMPLE,
    };
    expect(countFilled(r)).toBe(4);
  });
});
