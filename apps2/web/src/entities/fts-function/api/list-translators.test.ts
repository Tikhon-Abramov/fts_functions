import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid";

import {
  translateFilterModel,
  translateSortModel,
} from "src/entities/fts-function/api/list-translators";
import { FtsFunctionField } from "src/entities/fts-function/model";
import { describe, expect, it, vi } from "vitest";

describe("translateFilterModel", () => {
  it("returns an empty arg object for an empty model", () => {
    const out = translateFilterModel({ items: [] } as GridFilterModel);
    expect(out).toEqual({});
  });

  it("translates id `equals` to a single-element ids array", () => {
    const out = translateFilterModel({
      items: [{ field: FtsFunctionField.ID, operator: "equals", value: "42" }],
    });
    expect(out.ids).toEqual([42]);
  });

  it("translates id `!=` and ranges through the dedicated id* fields", () => {
    expect(
      translateFilterModel({
        items: [{ field: FtsFunctionField.ID, operator: "!=", value: "5" }],
      }).idNot,
    ).toBe(5);
    expect(
      translateFilterModel({
        items: [{ field: FtsFunctionField.ID, operator: ">", value: "5" }],
      }).idGt,
    ).toBe(5);
    expect(
      translateFilterModel({
        items: [{ field: FtsFunctionField.ID, operator: ">=", value: "5" }],
      }).idGte,
    ).toBe(5);
    expect(
      translateFilterModel({
        items: [{ field: FtsFunctionField.ID, operator: "<", value: "5" }],
      }).idLt,
    ).toBe(5);
    expect(
      translateFilterModel({
        items: [{ field: FtsFunctionField.ID, operator: "<=", value: "5" }],
      }).idLte,
    ).toBe(5);
  });

  it("no-ops id `isEmpty` / `isNotEmpty` (id is non-nullable PK)", () => {
    expect(
      translateFilterModel({
        items: [{ field: FtsFunctionField.ID, operator: "isEmpty", value: "" }],
      }),
    ).toEqual({});
    expect(
      translateFilterModel({
        items: [
          { field: FtsFunctionField.ID, operator: "isNotEmpty", value: "" },
        ],
      }),
    ).toEqual({});
  });

  it("ignores id filters with empty/null values", () => {
    expect(
      translateFilterModel({
        items: [{ field: FtsFunctionField.ID, operator: "equals", value: "" }],
      }),
    ).toEqual({});
    expect(
      translateFilterModel({
        items: [
          { field: FtsFunctionField.ID, operator: "equals", value: null },
        ],
      }),
    ).toEqual({});
  });

  it("translates name `isAnyOf` into ftsFunctionNameIds", () => {
    const out = translateFilterModel({
      items: [
        {
          field: FtsFunctionField.NAME,
          operator: "isAnyOf",
          value: ["1", "2", "abc"],
        },
      ],
    });
    expect(out.ftsFunctionNameIds).toEqual([1, 2]);
  });

  it("ignores dictionary filters with non-isAnyOf operators", () => {
    expect(
      translateFilterModel({
        items: [
          {
            field: FtsFunctionField.MARKER,
            operator: "contains",
            value: "x",
          },
        ],
      }),
    ).toEqual({});
  });

  it("ignores dictionary filters whose field is not mapped", () => {
    expect(
      translateFilterModel({
        items: [
          {
            field: "centralization",
            operator: "isAnyOf",
            value: [1, 2],
          },
        ],
      }),
    ).toEqual({});
  });
});

describe("translateSortModel", () => {
  it("returns {} when the model is empty", () => {
    expect(translateSortModel([] as GridSortModel)).toEqual({});
  });

  it("emits sortBy and sortDir for the first sortable field", () => {
    const out = translateSortModel([{ field: "createdAt", sort: "desc" }]);
    expect(out.sortBy).toBe("createdAt");
    expect(out.sortDir).toBe("desc");
  });

  it("drops unsupported sort fields silently along with sortDir", () => {
    // Emitting `sortDir` alone (without `sortBy`) flips the default cursor
    // direction server-side without the user noticing — translator must
    // drop both halves of the unsupported sort.
    const out = translateSortModel([{ field: "name", sort: "asc" }]);
    expect(out.sortBy).toBeUndefined();
    expect(out.sortDir).toBeUndefined();
  });

  it("warns and uses the first item when multiple sorts are passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    translateSortModel([
      { field: "createdAt", sort: "asc" },
      { field: "id", sort: "desc" },
    ]);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
