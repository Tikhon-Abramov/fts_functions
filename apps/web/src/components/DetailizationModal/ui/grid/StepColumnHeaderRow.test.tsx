import { StepColumnHeaderRow } from "src/components/DetailizationModal/ui/grid/StepColumnHeaderRow";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it } from "vitest";

describe("StepColumnHeaderRow", () => {
  it("renders without throwing", () => {
    expect(() => renderWithProviders(<StepColumnHeaderRow />)).not.toThrow();
  });
});
