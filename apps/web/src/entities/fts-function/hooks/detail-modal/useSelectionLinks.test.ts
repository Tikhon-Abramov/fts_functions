import type { Link, Row } from "src/entities/fts-function/types";

import { renderHook } from "@testing-library/react";
import { useSelectionLinks } from "src/entities/fts-function/hooks/detail-modal/useSelectionLinks";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionRelationType,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

const row = (id: string): Row => ({
  id,
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: "x",
  actionLabel: FtsFunctionActionType.KEEP,
});

const link = (id: string, fromId: string, toId: string): Link => ({
  id,
  fromId,
  toId,
  kind: FtsFunctionRelationType.CONNECTED,
});

describe("useSelectionLinks", () => {
  const links = [
    link("L1", "1", "2"),
    link("L2", "3", "1"),
    link("L3", "4", "5"),
  ];
  const rowMap = new Map([
    ["1", row("1")],
    ["2", row("2")],
  ]);

  it("returns empty linkedIds and selectedLinks when nothing is selected", () => {
    const { result } = renderHook(() => useSelectionLinks(links, null, rowMap));
    expect(result.current.linkedIds.size).toBe(0);
    expect(result.current.selectedLinks).toEqual([]);
    expect(result.current.selectedRow).toBeNull();
  });

  it("collects ids on either side of a link touching selectedId", () => {
    const { result } = renderHook(() => useSelectionLinks(links, "1", rowMap));
    expect(Array.from(result.current.linkedIds).sort()).toEqual(["2", "3"]);
    expect(result.current.selectedLinks.map((l) => l.id)).toEqual(["L1", "L2"]);
  });

  it("returns the resolved selectedRow when present in rowMap", () => {
    const { result } = renderHook(() => useSelectionLinks(links, "1", rowMap));
    expect(result.current.selectedRow?.id).toBe("1");
  });

  it("returns selectedRow=null when selectedId is not in rowMap", () => {
    const { result } = renderHook(() =>
      useSelectionLinks(links, "missing", rowMap),
    );
    expect(result.current.selectedRow).toBeNull();
  });

  it("survives malformed link entries (skipped, no crash)", () => {
    const malformed = [...links, { id: "bad" } as unknown as Link];
    const { result } = renderHook(() =>
      useSelectionLinks(malformed, "1", rowMap),
    );
    expect(result.current.linkedIds.size).toBe(2);
  });
});
