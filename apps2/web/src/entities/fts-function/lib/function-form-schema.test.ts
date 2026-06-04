import {
  EMPTY_FUNCTION_FORM,
  functionFormSchema,
} from "src/entities/fts-function/lib/function-form-schema";
import { describe, expect, it } from "vitest";

const filled = {
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

describe("functionFormSchema", () => {
  it("accepts a fully-populated form", () => {
    const parsed = functionFormSchema.safeParse(filled);
    expect(parsed.success).toBe(true);
  });

  it("defaults strategyProjectIds to an empty array when omitted", () => {
    const { strategyProjectIds: _omit, ...rest } = filled;
    const parsed = functionFormSchema.parse(rest);
    expect(parsed.strategyProjectIds).toEqual([]);
  });

  it("rejects an empty ftsFunctionNameId", () => {
    const parsed = functionFormSchema.safeParse({
      ...filled,
      ftsFunctionNameId: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects when any required scalar id is empty", () => {
    const required = [
      "ftsFunctionMarkerId",
      "ftsCentralizationId",
      "competencyCenterId",
      "curatorCentralOfficeId",
      "departmentHeadCentralOfficeId",
      "managerInterregionalInspectionId",
      "departmentHeadInterregionalInspectionId",
    ] as const;
    for (const key of required) {
      const parsed = functionFormSchema.safeParse({ ...filled, [key]: "" });
      expect(parsed.success, `${key} must reject ""`).toBe(false);
    }
  });

  it("EMPTY_FUNCTION_FORM is rejected by the schema (every id is empty)", () => {
    expect(functionFormSchema.safeParse(EMPTY_FUNCTION_FORM).success).toBe(
      false,
    );
  });
});
