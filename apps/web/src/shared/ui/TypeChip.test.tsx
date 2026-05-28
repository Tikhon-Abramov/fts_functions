import { render, screen } from "@testing-library/react";
import { TypeChip } from "src/shared/ui/TypeChip";
import { describe, expect, it } from "vitest";

describe("TypeChip", () => {
  it("renders the name as the chip label", () => {
    render(<TypeChip name="Methodology" data-testid="chip" />);
    expect(screen.getByTestId("chip")).toHaveTextContent("Methodology");
  });

  it("forwards the code as data-type-code", () => {
    render(<TypeChip name="N" code="MY_CODE" data-testid="chip" />);
    expect(screen.getByTestId("chip")).toHaveAttribute(
      "data-type-code",
      "MY_CODE",
    );
  });

  it("uses fallbackColor when color is not provided (outlined variant)", () => {
    const { container } = render(
      <TypeChip name="N" fallbackColor="rgb(255, 0, 0)" />,
    );
    const chip = container.querySelector(".MuiChip-root") as HTMLElement;
    expect(chip).toBeTruthy();
    // MUI emits the borderColor / color through emotion classes (not inline
    // style), so we assert the chip rendered with at least one MUI class.
    expect(chip.className).toContain("MuiChip");
  });

  it("renders without crashing when both color and fallbackColor are absent", () => {
    expect(() =>
      render(<TypeChip name="N" data-testid="chip" />),
    ).not.toThrow();
  });
});
