import {
  diffAddedDtis,
  diffRemovedDtis,
} from "src/entities/fts-function/lib/function-form";
import { describe, expect, it } from "vitest";

describe("diffAddedDtis", () => {
  it("returns ids present in next but not prev", () => {
    expect(diffAddedDtis(["1", "2"], ["1", "2", "3"])).toEqual(["3"]);
  });

  it("returns an empty array when nothing was added", () => {
    expect(diffAddedDtis(["1", "2"], ["1", "2"])).toEqual([]);
  });

  it("ignores ids that were removed", () => {
    expect(diffAddedDtis(["1", "2", "3"], ["1"])).toEqual([]);
  });

  it("preserves the order from the next list", () => {
    expect(diffAddedDtis(["a"], ["b", "a", "c"])).toEqual(["b", "c"]);
  });
});

describe("diffRemovedDtis", () => {
  it("returns ids present in prev but not next", () => {
    expect(diffRemovedDtis(["1", "2", "3"], ["1"])).toEqual(["2", "3"]);
  });

  it("returns an empty array when nothing was removed", () => {
    expect(diffRemovedDtis(["1", "2"], ["1", "2", "3"])).toEqual([]);
  });

  it("preserves the order from the prev list", () => {
    expect(diffRemovedDtis(["c", "b", "a"], [])).toEqual(["c", "b", "a"]);
  });

  it("is symmetric with diffAddedDtis on a swap", () => {
    const prev = ["1", "2"];
    const next = ["2", "3"];
    expect(diffAddedDtis(prev, next)).toEqual(["3"]);
    expect(diffRemovedDtis(prev, next)).toEqual(["1"]);
  });
});
