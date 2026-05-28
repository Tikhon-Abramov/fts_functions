import type { Row } from "src/entities/fts-function/types";

import { fireEvent, screen } from "@testing-library/react";
import { DataRow } from "src/components/DetailizationModal/ui/rows/DataRow";
import { RowPresentation } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

const row: Row = {
  id: "r1",
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: "do it",
  who: "alice",
  actionLabel: FtsFunctionActionType.KEEP,
};

const tableWrap = (ui: React.ReactNode) => (
  <table>
    <tbody>{ui}</tbody>
  </table>
);

describe("DataRow", () => {
  it("renders with the row's testid", () => {
    renderWithProviders(
      tableWrap(
        <DataRow
          row={row}
          indexLabel="1.1"
          presentation={() => RowPresentation.NORMAL}
          colorByCode={new Map()}
          onClick={vi.fn()}
          onRemove={vi.fn()}
          registerRef={() => () => undefined}
        />,
      ),
    );
    expect(screen.getByTestId("row-r1")).toBeInTheDocument();
  });

  it("invokes onClick(row.id) when the row is clicked", () => {
    const onClick = vi.fn();
    renderWithProviders(
      tableWrap(
        <DataRow
          row={row}
          indexLabel="1.1"
          presentation={() => RowPresentation.NORMAL}
          colorByCode={new Map()}
          onClick={onClick}
          onRemove={vi.fn()}
          registerRef={() => () => undefined}
        />,
      ),
    );
    fireEvent.click(screen.getByTestId("row-r1"));
    expect(onClick).toHaveBeenCalledWith("r1");
  });

  it("renders the detailText", () => {
    renderWithProviders(
      tableWrap(
        <DataRow
          row={row}
          indexLabel="1.1"
          presentation={() => RowPresentation.SELECTED}
          colorByCode={new Map()}
          onClick={vi.fn()}
          onRemove={vi.fn()}
          registerRef={() => () => undefined}
        />,
      ),
    );
    // Tooltip places the text in two places — assert at least one.
    expect(screen.getAllByText("do it").length).toBeGreaterThan(0);
  });
});
