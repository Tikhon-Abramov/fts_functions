import type { FtsFunctionDetailedResponseDto } from "src/shared/api/ftsFunctionsApi";

import { renderHook } from "@testing-library/react";
import { useStepRowsModel } from "src/entities/fts-function/hooks/detail-modal/useStepRowsModel";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionRelationType,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { describe, expect, it } from "vitest";

function detail(
  over: Partial<{
    id: number;
    step: string;
    category: string;
    action: string;
    text: string;
  }>,
) {
  return {
    id: over.id ?? 1,
    ftsFunctionStep: {
      id: 1,
      code: over.step ?? FtsFunctionStep.OBJECT_SELECTION,
    },
    ftsFunctionCategory: {
      id: 2,
      code: over.category ?? FtsFunctionCategory.METHODOLOGY,
    },
    ftsFunctionActionType: {
      id: 3,
      code: over.action ?? FtsFunctionActionType.KEEP,
    },
    ftsFunctionExecutionFrequency: null,
    ftsFunctionComplexity: null,
    ftsFunctionDetails: over.text ?? "",
    who: null,
    artifact: null,
    basis: null,
    artifactUsage: null,
    purpose: null,
    parents: [],
    children: [],
  };
}

describe("useStepRowsModel", () => {
  it("returns empty projections when functionRecord is null", () => {
    const { result } = renderHook(() => useStepRowsModel(null, []));
    expect(result.current.rows).toEqual([]);
    expect(result.current.links).toEqual([]);
    expect(result.current.step1Count).toBe(0);
    expect(result.current.step2Count).toBe(0);
    expect(result.current.rowMap.size).toBe(0);
  });

  it("buckets rows into step1 / step2 with correct counts", () => {
    const fr = {
      id: 1,
      ftsFunctionDetails: [
        detail({ id: 1, step: FtsFunctionStep.OBJECT_SELECTION }),
        detail({ id: 2, step: FtsFunctionStep.OBJECT_SELECTION }),
        detail({ id: 3, step: FtsFunctionStep.CLUSTERING_IMPACT }),
      ],
    } as unknown as FtsFunctionDetailedResponseDto;

    const { result } = renderHook(() => useStepRowsModel(fr, []));
    expect(result.current.step1Count).toBe(2);
    expect(result.current.step2Count).toBe(1);
    expect(result.current.step1IndexMap.get("1")).toBe(1);
    expect(result.current.step1IndexMap.get("2")).toBe(2);
  });

  it("tracks link counts per category for step1 rows", () => {
    const fr = {
      id: 1,
      ftsFunctionDetails: [
        {
          ...detail({
            id: 1,
            step: FtsFunctionStep.OBJECT_SELECTION,
            category: FtsFunctionCategory.METHODOLOGY,
          }),
          parents: [
            {
              parentFtsFunctionId: 1,
              childFtsFunctionId: 99,
              relationTypeId: 100,
              relationType: {
                id: 100,
                code: FtsFunctionRelationType.CONNECTED,
              },
            },
          ],
        },
      ],
    } as unknown as FtsFunctionDetailedResponseDto;

    const { result } = renderHook(() => useStepRowsModel(fr, []));
    expect(
      result.current.linkCountsPerCategory[FtsFunctionCategory.METHODOLOGY],
    ).toBe(1);
    expect(
      result.current.linkCountsPerCategory[FtsFunctionCategory.ACTUAL_ACTION],
    ).toBe(0);
  });

  it("populates colorByCode from typesAll", () => {
    const { result } = renderHook(() =>
      useStepRowsModel(null, [
        {
          id: 1,
          code: "X",
          name: "X",
          color: "#abc",
          description: null,
          supertypeId: null,
          category: "FTS_FUNCTION_CATEGORY",
        },
      ]),
    );
    expect(result.current.colorByCode.get("X")).toBe("#abc");
  });
});
