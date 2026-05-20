import { render, screen } from "@testing-library/react";
import { ChipListCell } from "src/shared/ui/grid-cells/ChipListCell";
import { describe, expect, it } from "vitest";

describe("ChipListCell", () => {
  it("renders one chip per value", () => {
    render(
      <ChipListCell
        values={["A", "B", "C"]}
        borderColor="#fff"
        textColor="#000"
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("renders nothing when values is undefined", () => {
    const { container } = render(
      <ChipListCell values={undefined} borderColor="#fff" textColor="#000" />,
    );
    expect(container.querySelectorAll(".MuiChip-root")).toHaveLength(0);
  });

  it("renders an empty container for an empty values array", () => {
    const { container } = render(
      <ChipListCell values={[]} borderColor="#fff" textColor="#000" />,
    );
    expect(container.querySelectorAll(".MuiChip-root")).toHaveLength(0);
  });

  it("renders a coloured dot per chip when colorFor is provided", () => {
    const palette: Record<string, string> = {
      A: "#ff0000",
      B: "#00ff00",
    };
    render(
      <ChipListCell
        values={["A", "B"]}
        borderColor="#fff"
        textColor="#000"
        colorFor={(v) => palette[v]}
      />,
    );
    const dots = screen.getAllByTestId("chip-list-dot");
    expect(dots).toHaveLength(2);
    expect(dots[0].getAttribute("data-color")).toBe(palette.A);
    expect(dots[1].getAttribute("data-color")).toBe(palette.B);
  });

  it("falls back to textColor when colorFor returns nullish", () => {
    render(
      <ChipListCell
        values={["X"]}
        borderColor="#fff"
        textColor="#0a141e"
        colorFor={() => null}
      />,
    );
    const dot = screen.getByTestId("chip-list-dot");
    expect(dot.getAttribute("data-color")).toBe("#0a141e");
  });

  it("does not render dots when colorFor is omitted", () => {
    render(
      <ChipListCell values={["A", "B"]} borderColor="#fff" textColor="#000" />,
    );
    expect(screen.queryAllByTestId("chip-list-dot")).toHaveLength(0);
  });
});
