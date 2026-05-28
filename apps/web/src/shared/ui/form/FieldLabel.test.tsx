import { screen } from "@testing-library/react";
import { FieldLabel } from "src/shared/ui/form/FieldLabel";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it } from "vitest";

describe("FieldLabel", () => {
  it("renders its children", () => {
    renderWithProviders(<FieldLabel>Hello</FieldLabel>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("accepts bold and block props without crashing", () => {
    expect(() =>
      renderWithProviders(
        <FieldLabel bold block fontSize="0.8rem">
          Bold
        </FieldLabel>,
      ),
    ).not.toThrow();
  });
});
