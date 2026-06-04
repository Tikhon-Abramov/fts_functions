import type { Row } from "src/entities/fts-function/types";

import { act, renderHook } from "@testing-library/react";
import { useRowDetailsDraft } from "src/components/RowDetailsPanel/hooks/useRowDetailsDraft";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

const row = (id: string, over?: Partial<Row>): Row => ({
  id,
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: "x",
  actionLabel: FtsFunctionActionType.KEEP,
  ...over,
});

describe("useRowDetailsDraft", () => {
  it("starts in non-editing state with an empty draft", () => {
    const { result } = renderHook(() => useRowDetailsDraft(row("1")));
    expect(result.current.editing).toBe(false);
    expect(result.current.draft).toEqual({});
  });

  it("startEdit seeds the draft from the row, including default periodicity / complexity", () => {
    const { result } = renderHook(() =>
      useRowDetailsDraft(row("1", { who: "Alice" })),
    );
    act(() => result.current.startEdit());
    expect(result.current.editing).toBe(true);
    expect(result.current.draft.who).toBe("Alice");
    expect(result.current.draft.periodicity).toBe("DAILY");
    expect(result.current.draft.complexity).toBe("MIDDLE");
  });

  it("startEdit seeds primary fields (category / detailText / actionLabel) from the row", () => {
    const { result } = renderHook(() =>
      useRowDetailsDraft(row("1", { detailText: "hello world" })),
    );
    act(() => result.current.startEdit());
    expect(result.current.draft.category).toBe(FtsFunctionCategory.METHODOLOGY);
    expect(result.current.draft.detailText).toBe("hello world");
    expect(result.current.draft.actionLabel).toBe(FtsFunctionActionType.KEEP);
  });

  it("startEdit no-ops when row is null", () => {
    const { result } = renderHook(() => useRowDetailsDraft(null));
    act(() => result.current.startEdit());
    expect(result.current.editing).toBe(false);
  });

  it("setField updates a single key in the draft", () => {
    const { result } = renderHook(() => useRowDetailsDraft(row("1")));
    act(() => result.current.startEdit());
    act(() => result.current.setField("who", "Bob"));
    expect(result.current.draft.who).toBe("Bob");
  });

  it("cancelEdit clears editing and draft", () => {
    const { result } = renderHook(() => useRowDetailsDraft(row("1")));
    act(() => result.current.startEdit());
    act(() => result.current.cancelEdit());
    expect(result.current.editing).toBe(false);
    expect(result.current.draft).toEqual({});
  });

  it("finishEdit drops editing flag but keeps the draft accessible", () => {
    const { result } = renderHook(() => useRowDetailsDraft(row("1")));
    act(() => result.current.startEdit());
    act(() => result.current.finishEdit());
    expect(result.current.editing).toBe(false);
  });

  it("resets editing state when the row id changes", () => {
    const { result, rerender } = renderHook(
      ({ r }: { r: Row | null }) => useRowDetailsDraft(r),
      { initialProps: { r: row("1") } },
    );
    act(() => result.current.startEdit());
    rerender({ r: row("2") });
    expect(result.current.editing).toBe(false);
    expect(result.current.draft).toEqual({});
  });
});
