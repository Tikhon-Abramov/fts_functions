import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { renderHook } from "@testing-library/react";
import { useTypeColorLookup } from "src/entities/fts-function/hooks/colors/useTypeColorLookup";
import { describe, expect, it } from "vitest";

const t = (
  id: number,
  code: string,
  name: string,
  category: TypeResponseDto["category"],
  color?: string | null,
): TypeResponseDto => ({
  id,
  code,
  name,
  description: null,
  supertypeId: null,
  category,
  color,
});

describe("useTypeColorLookup", () => {
  it("returns undefined when looking up an unknown name", () => {
    const { result } = renderHook(() => useTypeColorLookup([]));
    expect(result.current("FTS_FUNCTION_NAME", "anything")).toBeUndefined();
  });

  it("returns undefined when name is undefined (early-out)", () => {
    const types = [t(1, "A", "Alpha", "FTS_FUNCTION_NAME", "#fff")];
    const { result } = renderHook(() => useTypeColorLookup(types));
    expect(result.current("FTS_FUNCTION_NAME", undefined)).toBeUndefined();
  });

  it("indexes by category::name and returns the matching Type", () => {
    const types = [
      t(1, "A", "Alpha", "FTS_FUNCTION_NAME", "#fff"),
      t(2, "M", "Alpha", "FTS_FUNCTION_MARKER", "#000"),
    ];
    const { result } = renderHook(() => useTypeColorLookup(types));
    expect(result.current("FTS_FUNCTION_NAME", "Alpha")?.id).toBe(1);
    expect(result.current("FTS_FUNCTION_MARKER", "Alpha")?.id).toBe(2);
  });

  it("when two types share a (category, name) the later one wins", () => {
    // Real dictionaries should never produce this, but the hook must not
    // crash and must be deterministic.
    const types = [
      t(1, "A", "Alpha", "FTS_FUNCTION_NAME", "#111"),
      t(2, "A2", "Alpha", "FTS_FUNCTION_NAME", "#222"),
    ];
    const { result } = renderHook(() => useTypeColorLookup(types));
    expect(result.current("FTS_FUNCTION_NAME", "Alpha")?.id).toBe(2);
  });

  it("returns a stable callback across renders when types is stable", () => {
    const types = [t(1, "A", "Alpha", "FTS_FUNCTION_NAME", "#fff")];
    const { result, rerender } = renderHook(
      ({ ts }) => useTypeColorLookup(ts),
      {
        initialProps: { ts: types },
      },
    );
    const first = result.current;
    rerender({ ts: types });
    expect(result.current).toBe(first);
  });
});
