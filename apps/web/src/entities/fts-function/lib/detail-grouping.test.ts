import type { Link, Row } from "src/entities/fts-function/types";

import {
  buildRowIndexMap,
  countStep1LinksByCategory,
  groupRowsByCategory,
} from "src/entities/fts-function/lib/detail-grouping";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionRelationType,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

function row(over: Partial<Row> & { id: string }): Row {
  return {
    step: FtsFunctionStep.OBJECT_SELECTION,
    category: FtsFunctionCategory.METHODOLOGY,
    detailText: "x",
    actionLabel: FtsFunctionActionType.KEEP,
    ...over,
  };
}

describe("groupRowsByCategory", () => {
  it("returns an entry for every known category even with no rows", () => {
    const out = groupRowsByCategory([]);
    expect(out[FtsFunctionCategory.METHODOLOGY]).toEqual([]);
    expect(out[FtsFunctionCategory.ACTUAL_ACTION]).toEqual([]);
    expect(out[FtsFunctionCategory.CONTROL_ANALYTICS]).toEqual([]);
  });

  it("buckets rows by their category", () => {
    const r1 = row({ id: "1", category: FtsFunctionCategory.METHODOLOGY });
    const r2 = row({ id: "2", category: FtsFunctionCategory.ACTUAL_ACTION });
    const r3 = row({
      id: "3",
      category: FtsFunctionCategory.CONTROL_ANALYTICS,
    });
    const r4 = row({ id: "4", category: FtsFunctionCategory.METHODOLOGY });
    const out = groupRowsByCategory([r1, r2, r3, r4]);
    expect(out[FtsFunctionCategory.METHODOLOGY]).toEqual([r1, r4]);
    expect(out[FtsFunctionCategory.ACTUAL_ACTION]).toEqual([r2]);
    expect(out[FtsFunctionCategory.CONTROL_ANALYTICS]).toEqual([r3]);
  });

  it("skips rows whose category is unknown / falsy", () => {
    const r1 = row({ id: "1" });
    // Force-cast: simulate a row that slipped past the mapper with a junk
    // category — the helper is the last line of defence.
    const bad = { ...r1, id: "2", category: "MYSTERY" } as unknown as Row;
    const out = groupRowsByCategory([r1, bad]);
    expect(out[FtsFunctionCategory.METHODOLOGY]).toHaveLength(1);
  });
});

describe("buildRowIndexMap", () => {
  it("returns an empty map for an empty input", () => {
    expect(buildRowIndexMap([]).size).toBe(0);
  });

  it("indexes rows starting at 1, in order", () => {
    const rows = [row({ id: "a" }), row({ id: "b" }), row({ id: "c" })];
    const m = buildRowIndexMap(rows);
    expect(m.get("a")).toBe(1);
    expect(m.get("b")).toBe(2);
    expect(m.get("c")).toBe(3);
  });
});

describe("countStep1LinksByCategory", () => {
  function link(over: Partial<Link> & { id: string }): Link {
    return {
      fromId: "1",
      toId: "2",
      kind: FtsFunctionRelationType.CONNECTED,
      ...over,
    };
  }

  it("returns zero counts for every category when there are no links", () => {
    const out = countStep1LinksByCategory([], [], new Map());
    expect(out[FtsFunctionCategory.METHODOLOGY]).toBe(0);
    expect(out[FtsFunctionCategory.ACTUAL_ACTION]).toBe(0);
    expect(out[FtsFunctionCategory.CONTROL_ANALYTICS]).toBe(0);
  });

  it("counts links whose fromId is a step-1 row, bucketed by that row's category", () => {
    const r1 = row({ id: "1", category: FtsFunctionCategory.METHODOLOGY });
    const r2 = row({ id: "2", category: FtsFunctionCategory.ACTUAL_ACTION });
    const rowMap = new Map([
      ["1", r1],
      ["2", r2],
    ]);
    const links = [
      link({ id: "L1", fromId: "1", toId: "999" }),
      link({ id: "L2", fromId: "1", toId: "999" }),
      link({ id: "L3", fromId: "2", toId: "999" }),
    ];
    const out = countStep1LinksByCategory([r1, r2], links, rowMap);
    expect(out[FtsFunctionCategory.METHODOLOGY]).toBe(2);
    expect(out[FtsFunctionCategory.ACTUAL_ACTION]).toBe(1);
  });

  it("ignores links whose fromId is not in the step-1 set", () => {
    const r1 = row({ id: "1", category: FtsFunctionCategory.METHODOLOGY });
    const rowMap = new Map([["1", r1]]);
    const links = [link({ id: "L1", fromId: "999", toId: "1" })];
    const out = countStep1LinksByCategory([r1], links, rowMap);
    expect(out[FtsFunctionCategory.METHODOLOGY]).toBe(0);
  });

  it("survives malformed link entries with missing fromId", () => {
    const r1 = row({ id: "1", category: FtsFunctionCategory.METHODOLOGY });
    const rowMap = new Map([["1", r1]]);
    const bad = { id: "L1", toId: "1" } as unknown as Link;
    const out = countStep1LinksByCategory([r1], [bad], rowMap);
    expect(out[FtsFunctionCategory.METHODOLOGY]).toBe(0);
  });
});
