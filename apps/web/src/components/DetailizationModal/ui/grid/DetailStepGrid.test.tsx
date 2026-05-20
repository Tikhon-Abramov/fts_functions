import { screen } from "@testing-library/react";
import { DetailStepGrid } from "src/components/DetailizationModal/ui/grid/DetailStepGrid";
import { RowPresentation } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import { groupRowsByCategory } from "src/entities/fts-function/lib/detail-grouping";
import { FtsFunctionCategory } from "src/entities/fts-function/model";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

const emptyByCategory = groupRowsByCategory([]);
const zeroLinks = {
  [FtsFunctionCategory.METHODOLOGY]: 0,
  [FtsFunctionCategory.ACTUAL_ACTION]: 0,
  [FtsFunctionCategory.CONTROL_ANALYTICS]: 0,
};

describe("DetailStepGrid", () => {
  function baseProps() {
    return {
      step1ByCategory: emptyByCategory,
      step2ByCategory: emptyByCategory,
      step1IndexMap: new Map<string, number>(),
      step2IndexMap: new Map<string, number>(),
      linkCountsPerCategory: zeroLinks,
      presentation: () => RowPresentation.NORMAL,
      colorByCode: new Map<string, string | null | undefined>(),
      onRowClick: vi.fn(),
      onRemoveRow: vi.fn(),
      registerRowRef: () => () => undefined,
    };
  }

  it("renders a loading spinner when isLoading", () => {
    renderWithProviders(
      <DetailStepGrid isLoading isError={false} {...baseProps()} />,
    );
    // CircularProgress renders a progressbar role.
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders the load-error label when isError", () => {
    renderWithProviders(
      <DetailStepGrid isLoading={false} isError {...baseProps()} />,
    );
    // Russian translation for modal.loadError.
    expect(screen.getByText(/Не удалось загрузить/)).toBeInTheDocument();
  });

  it("renders the sticky header rows when neither loading nor error", () => {
    renderWithProviders(
      <DetailStepGrid isLoading={false} isError={false} {...baseProps()} />,
    );
    expect(screen.getByTestId("text-step1-title")).toBeInTheDocument();
  });
});
