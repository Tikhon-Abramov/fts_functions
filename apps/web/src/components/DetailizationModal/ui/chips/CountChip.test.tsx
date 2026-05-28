import { screen } from "@testing-library/react";
import {
  CountChip,
  Emphasis,
} from "src/components/DetailizationModal/ui/chips/CountChip";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it } from "vitest";

describe("CountChip", () => {
  it("renders the label", () => {
    renderWithProviders(<CountChip label="42" />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("accepts the ACCENT emphasis variant without crashing", () => {
    expect(() =>
      renderWithProviders(<CountChip label="9" emphasis={Emphasis.ACCENT} />),
    ).not.toThrow();
  });

  it("accepts the SUBTLE emphasis variant without crashing", () => {
    expect(() =>
      renderWithProviders(<CountChip label="9" emphasis={Emphasis.SUBTLE} />),
    ).not.toThrow();
  });
});
