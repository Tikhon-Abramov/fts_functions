import { fireEvent, screen } from "@testing-library/react";
import { StepTab } from "src/components/AddItemForm/ui/StepTab";
import { FtsFunctionStep } from "src/entities/fts-function/model";
import {
  renderWithProviders,
  testTheme,
} from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

describe("StepTab", () => {
  it("renders the label and a step-keyed test id", () => {
    renderWithProviders(
      <StepTab
        step={FtsFunctionStep.OBJECT_SELECTION}
        activeStep={FtsFunctionStep.OBJECT_SELECTION}
        label="Step 1"
        filled={false}
        onSelect={vi.fn()}
        theme={testTheme}
      />,
    );
    expect(screen.getByTestId("button-step-1")).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
  });

  it("invokes onSelect when clicked", () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <StepTab
        step={FtsFunctionStep.CLUSTERING_IMPACT}
        activeStep={FtsFunctionStep.OBJECT_SELECTION}
        label="Step 2"
        filled={false}
        onSelect={onSelect}
        theme={testTheme}
      />,
    );
    fireEvent.click(screen.getByTestId("button-step-2"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("shows the OK chip when filled is true", () => {
    renderWithProviders(
      <StepTab
        step={FtsFunctionStep.OBJECT_SELECTION}
        activeStep={FtsFunctionStep.OBJECT_SELECTION}
        label="Step 1"
        filled
        onSelect={vi.fn()}
        theme={testTheme}
      />,
    );
    expect(screen.getByTestId("chip-filled-step-1")).toBeInTheDocument();
  });

  it("does NOT render the OK chip when filled is false", () => {
    renderWithProviders(
      <StepTab
        step={FtsFunctionStep.OBJECT_SELECTION}
        activeStep={FtsFunctionStep.OBJECT_SELECTION}
        label="Step 1"
        filled={false}
        onSelect={vi.fn()}
        theme={testTheme}
      />,
    );
    expect(screen.queryByTestId("chip-filled-step-1")).toBeNull();
  });
});
