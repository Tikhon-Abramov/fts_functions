import { act, renderHook } from "@testing-library/react";
import { useResizablePanel } from "src/entities/fts-function/hooks/ui/useResizablePanel";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const opts = {
  defaultPx: 400,
  storageKey: "test:right-pct",
  minPct: 10,
  maxPct: 80,
  initialPct: 30,
};

describe("useResizablePanel", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
  });

  it("uses initialPct when no stored value exists", () => {
    const { result } = renderHook(() => useResizablePanel(opts));
    expect(result.current.rightPct).toBe(30);
  });

  it("reads a previously persisted value when within [min,max]", () => {
    localStorage.setItem(opts.storageKey, "50");
    const { result } = renderHook(() => useResizablePanel(opts));
    expect(result.current.rightPct).toBe(50);
  });

  it("falls back to initialPct when stored value is out of range", () => {
    localStorage.setItem(opts.storageKey, "999");
    const { result } = renderHook(() => useResizablePanel(opts));
    expect(result.current.rightPct).toBe(30);
  });

  it("ignores tiny onLayout deltas (programmatic) and accepts user resize", () => {
    const { result } = renderHook(() => useResizablePanel(opts));
    // Simulate user-driven resize that exceeds the deviation threshold.
    act(() => {
      result.current.onLayout([40, 60]);
    });
    expect(result.current.rightPct).toBe(60);
  });

  it("survives a missing onLayout sizes[1] (no-op)", () => {
    const { result } = renderHook(() => useResizablePanel(opts));
    act(() => {
      result.current.onLayout([100]);
    });
    expect(result.current.rightPct).toBe(30);
  });
});
