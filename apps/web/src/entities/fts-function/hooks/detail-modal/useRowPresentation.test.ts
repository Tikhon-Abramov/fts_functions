import type { Row } from "src/entities/fts-function/types";

import { renderHook } from "@testing-library/react";
import {
  RowPresentation,
  useRowPresentation,
} from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
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

describe("useRowPresentation", () => {
  it("returns NORMAL for every row when nothing is selected", () => {
    const { result } = renderHook(() => useRowPresentation(null, new Set()));
    expect(result.current(row("1"))).toBe(RowPresentation.NORMAL);
  });

  it("returns SELECTED for the selected row", () => {
    const { result } = renderHook(() =>
      useRowPresentation("1", new Set(["1", "2"])),
    );
    expect(result.current(row("1"))).toBe(RowPresentation.SELECTED);
  });

  it("returns LINKED for rows in linkedIds (and not the selected row)", () => {
    const { result } = renderHook(() =>
      useRowPresentation("1", new Set(["2"])),
    );
    expect(result.current(row("2"))).toBe(RowPresentation.LINKED);
  });

  it("returns DIMMED for rows neither selected nor linked when selection is active", () => {
    const { result } = renderHook(() =>
      useRowPresentation("1", new Set(["2"])),
    );
    expect(result.current(row("3"))).toBe(RowPresentation.DIMMED);
  });
});
