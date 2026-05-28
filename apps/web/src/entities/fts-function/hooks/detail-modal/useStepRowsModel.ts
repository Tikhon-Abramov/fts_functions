import type { FtsFunctionCategory } from "src/entities/fts-function/model";
import type { Link, Row } from "src/entities/fts-function/types";
import type {
  FtsFunctionDetailedResponseDto,
  TypeResponseDto,
} from "src/shared/api/ftsFunctionsApi";

import { useMemo } from "react";

import {
  mapFtsFunctionDetailApiToRow,
  mapFtsFunctionDetailsToLinks,
} from "src/entities/fts-function/api/mappers";
import {
  buildRowIndexMap,
  countStep1LinksByCategory,
  flattenRowsByRenderedCategoryOrder,
  groupRowsByCategory,
  type RowsByCategory,
} from "src/entities/fts-function/lib/detail-grouping";
import { FtsFunctionStep } from "src/entities/fts-function/model";

export type StepRowsModel = {
  rows: Row[];
  links: Link[];
  rowMap: Map<string, Row>;
  step1Rows: Row[];
  step2Rows: Row[];
  step1Count: number;
  step2Count: number;
  step1IndexMap: Map<string, number>;
  step2IndexMap: Map<string, number>;
  step1ByCategory: RowsByCategory;
  step2ByCategory: RowsByCategory;
  linkCountsPerCategory: Record<FtsFunctionCategory, number>;

  /**
   * Type code → color, sourced from the dictionary so action chips paint
   * correctly.
   */
  colorByCode: Map<string, string | null | undefined>;
};

/**
 * Single hook that derives every row/link/category projection the modal needs
 * from a function record.
 */
export function useStepRowsModel(
    functionRecord: FtsFunctionDetailedResponseDto | null,
    typesAll: TypeResponseDto[] | undefined,
): StepRowsModel {
  const rows: Row[] = useMemo(
      () =>
          (functionRecord?.ftsFunctionDetails ?? [])
              .map(mapFtsFunctionDetailApiToRow)
              .filter((row): row is Row => row !== null),
      [functionRecord],
  );

  const links: Link[] = useMemo(
      () =>
          functionRecord
              ? mapFtsFunctionDetailsToLinks(functionRecord.ftsFunctionDetails)
              : [],
      [functionRecord],
  );

  const rowMap = useMemo(() => {
    const map = new Map<string, Row>();

    for (const row of rows) {
      if (row?.id) map.set(row.id, row);
    }

    return map;
  }, [rows]);

  const stepBuckets = useMemo(() => {
    const step1: Row[] = [];
    const step2: Row[] = [];

    for (const row of rows) {
      if (row?.step === FtsFunctionStep.OBJECT_SELECTION) {
        step1.push(row);
      } else if (row?.step === FtsFunctionStep.CLUSTERING_IMPACT) {
        step2.push(row);
      }
    }

    return { step1, step2 };
  }, [rows]);

  const step1ByCategory = useMemo(
      () => groupRowsByCategory(stepBuckets.step1),
      [stepBuckets.step1],
  );

  const step2ByCategory = useMemo(
      () => groupRowsByCategory(stepBuckets.step2),
      [stepBuckets.step2],
  );

  const step1RenderedRows = useMemo(
      () => flattenRowsByRenderedCategoryOrder(step1ByCategory),
      [step1ByCategory],
  );

  const step2RenderedRows = useMemo(
      () => flattenRowsByRenderedCategoryOrder(step2ByCategory),
      [step2ByCategory],
  );

  const step1IndexMap = useMemo(
      () => buildRowIndexMap(step1RenderedRows),
      [step1RenderedRows],
  );

  const step2IndexMap = useMemo(
      () => buildRowIndexMap(step2RenderedRows),
      [step2RenderedRows],
  );

  const linkCountsPerCategory = useMemo(
      () => countStep1LinksByCategory(stepBuckets.step1, links, rowMap),
      [stepBuckets.step1, links, rowMap],
  );

  const colorByCode = useMemo(() => {
    const map = new Map<string, string | null | undefined>();

    typesAll?.forEach((type) => {
      map.set(type.code, type.color);
    });

    return map;
  }, [typesAll]);

  const { step1: step1Rows, step2: step2Rows } = stepBuckets;

  return {
    rows,
    links,
    rowMap,
    step1Rows,
    step2Rows,
    step1Count: step1Rows.length,
    step2Count: step2Rows.length,
    step1IndexMap,
    step2IndexMap,
    step1ByCategory,
    step2ByCategory,
    linkCountsPerCategory,
    colorByCode,
  };
}