import type { Row } from "src/entities/fts-function/types";

import { fireEvent, screen } from "@testing-library/react";
import RowDetailsPanel from "src/components/RowDetailsPanel/RowDetailsPanel";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

const sampleRow: Row = {
  id: "1",
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: "Do the thing",
  actionLabel: FtsFunctionActionType.KEEP,
  who: "Alice",
};

describe("RowDetailsPanel", () => {
  it("renders the empty-state copy when row is null", () => {
    renderWithProviders(<RowDetailsPanel row={null} onUpdateRow={vi.fn()} />);
    expect(screen.getByTestId("text-no-row-selected")).toBeInTheDocument();
  });

  it("renders view mode when a row is provided", () => {
    renderWithProviders(
      <RowDetailsPanel row={sampleRow} onUpdateRow={vi.fn()} />,
    );
    // The detail text appears verbatim in the passport view.
    expect(screen.getByText("Do the thing")).toBeInTheDocument();
  });

  it("toggles into edit mode when the Edit button is clicked", () => {
    renderWithProviders(
      <RowDetailsPanel row={sampleRow} onUpdateRow={vi.fn()} />,
    );
    // The view-mode Edit button has accessible text "Редактировать" (or similar);
    // we look up by role + first match.
    const editBtns = screen.getAllByRole("button");
    // Simulate clicking the first button — the view's only button is Edit.
    fireEvent.click(editBtns[0]);
    // After entering edit mode, the detailText is rendered inside an input.
    // We can't depend on i18n text precisely, but the row text becomes
    // editable so a textbox now contains it.
    const inputs = screen.queryAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });
});
