import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { renderHook } from "@testing-library/react";
import { useDictionary } from "src/entities/fts-function/hooks/data/useDictionary";
import { describe, expect, it } from "vitest";

const t = (
  id: number,
  code: string,
  name: string,
  category: TypeResponseDto["category"],
): TypeResponseDto => ({
  id,
  code,
  name,
  description: null,
  supertypeId: null,
  category,
});

describe("useDictionary", () => {
  it("returns empty buckets for every category when no types are passed", () => {
    const { result } = renderHook(() => useDictionary([]));
    expect(result.current.byCategory.FTS_FUNCTION_NAME).toEqual([]);
    expect(result.current.optionsByCategory.FTS_FUNCTION_NAME).toEqual([]);
    expect(result.current.byId.size).toBe(0);
    expect(result.current.byCode.size).toBe(0);
  });

  it("buckets types by category and produces options with {value,label}", () => {
    const types = [
      t(1, "A", "Alpha", "FTS_FUNCTION_NAME"),
      t(2, "B", "Bravo", "FTS_FUNCTION_NAME"),
      t(3, "M1", "Marker 1", "FTS_FUNCTION_MARKER"),
    ];
    const { result } = renderHook(() => useDictionary(types));
    expect(result.current.byCategory.FTS_FUNCTION_NAME).toHaveLength(2);
    expect(result.current.byCategory.FTS_FUNCTION_MARKER).toHaveLength(1);
    expect(result.current.optionsByCategory.FTS_FUNCTION_NAME).toEqual([
      { value: 1, label: "Alpha" },
      { value: 2, label: "Bravo" },
    ]);
  });

  it("populates byId and byCode lookups", () => {
    const types = [t(1, "A", "Alpha", "FTS_FUNCTION_NAME")];
    const { result } = renderHook(() => useDictionary(types));
    expect(result.current.byId.get(1)?.code).toBe("A");
    expect(result.current.byCode.get("A")?.id).toBe(1);
  });

  it("memoises across renders when input identity is stable", () => {
    const types = [t(1, "A", "Alpha", "FTS_FUNCTION_NAME")];
    const { result, rerender } = renderHook(({ ts }) => useDictionary(ts), {
      initialProps: { ts: types },
    });
    const first = result.current;
    rerender({ ts: types });
    expect(result.current).toBe(first);
  });
});
