import { render, screen } from "@testing-library/react";
import {
  TextWrapCell,
  TextWrapCellAlign,
} from "src/shared/ui/grid-cells/TextWrapCell";
import { describe, expect, it } from "vitest";

describe("TextWrapCell", () => {
  it("renders children inside a container with the test id", () => {
    render(<TextWrapCell data-testid="cell">Long wrapped value</TextWrapCell>);

    const cell = screen.getByTestId("cell");
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveTextContent("Long wrapped value");
  });

  it("uses left alignment by default", () => {
    render(<TextWrapCell data-testid="cell">left</TextWrapCell>);
    const cell = screen.getByTestId("cell");
    expect(cell).toHaveStyle({ textAlign: "left" });
  });

  it("centers content when align=CENTER", () => {
    render(
      <TextWrapCell data-testid="cell" align={TextWrapCellAlign.CENTER}>
        centered
      </TextWrapCell>,
    );
    const cell = screen.getByTestId("cell");
    expect(cell).toHaveStyle({
      textAlign: "center",
      display: "flex",
      justifyContent: "center",
    });
  });
});
