import type { FunctionFormFields } from "src/entities/fts-function/lib/function-form-schema";

import { buildFunctionDto } from "src/entities/fts-function/lib/function-form";
import { describe, expect, it } from "vitest";

const form: FunctionFormFields = {
  ftsFunctionNameId: "1",
  ftsFunctionMarkerId: "2",
  ftsCentralizationId: "3",
  competencyCenterId: "4",
  curatorCentralOfficeId: "5",
  departmentHeadCentralOfficeId: "6",
  managerInterregionalInspectionId: "7",
  departmentHeadInterregionalInspectionId: "8",
  strategyProjectIds: ["a", "b"],
};

describe("buildFunctionDto", () => {
  it("coerces every scalar id field to a number", () => {
    const dto = buildFunctionDto(form);
    expect(dto.ftsFunctionNameId).toBe(1);
    expect(dto.ftsFunctionMarkerId).toBe(2);
    expect(dto.ftsCentralizationId).toBe(3);
    expect(dto.competencyCenterId).toBe(4);
    expect(dto.curatorCentralOfficeId).toBe(5);
    expect(dto.departmentHeadCentralOfficeId).toBe(6);
    expect(dto.managerInterregionalInspectionId).toBe(7);
    expect(dto.departmentHeadInterregionalInspectionId).toBe(8);
  });

  it("does NOT include strategyProjectIds in the DTO (handled separately)", () => {
    const dto = buildFunctionDto(form);
    expect("strategyProjectIds" in dto).toBe(false);
  });

  it("coerces a non-numeric id string to NaN (zod validates upstream)", () => {
    const dto = buildFunctionDto({ ...form, ftsFunctionNameId: "abc" });
    expect(Number.isNaN(dto.ftsFunctionNameId)).toBe(true);
  });
});
