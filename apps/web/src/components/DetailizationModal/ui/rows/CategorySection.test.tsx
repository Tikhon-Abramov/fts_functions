import type { Row } from "src/entities/fts-function/types";

import { screen } from "@testing-library/react";
import { CategorySection } from "src/components/DetailizationModal/ui/rows/CategorySection";
import { RowPresentation } from "src/entities/fts-function/hooks/detail-modal/useRowPresentation";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

const row = (id: string, step: FtsFunctionStep): Row => ({
  id,
  step,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: id,
  actionLabel: FtsFunctionActionType.KEEP,
});

const colors = { bg: "#000", border: "#fff", text: "#aaa" };

describe("CategorySection", () => {
  it("returns null when both step lists are empty", () => {
    const { container } = renderWithProviders(
      <CategorySection
        category={FtsFunctionCategory.METHODOLOGY}
        step1Rows={[]}
        step2Rows={[]}
        step1IndexMap={new Map()}
        step2IndexMap={new Map()}
        linkCount={0}
        colors={colors}
        presentation={() => RowPresentation.NORMAL}
        colorByCode={new Map()}
        onRowClick={vi.fn()}
        onRemoveRow={vi.fn()}
        registerRowRef={() => () => undefined}
      />,
    );
    expect(container.querySelector(`[data-testid^="header-cat-"]`)).toBeNull();
  });

  it("renders the category banner and rows from both steps", () => {
    const r1 = row("a", FtsFunctionStep.OBJECT_SELECTION);
    const r2 = row("b", FtsFunctionStep.CLUSTERING_IMPACT);
    renderWithProviders(
      <CategorySection
        category={FtsFunctionCategory.METHODOLOGY}
        step1Rows={[r1]}
        step2Rows={[r2]}
        step1IndexMap={new Map([["a", 1]])}
        step2IndexMap={new Map([["b", 1]])}
        linkCount={3}
        colors={colors}
        presentation={() => RowPresentation.NORMAL}
        colorByCode={new Map()}
        onRowClick={vi.fn()}
        onRemoveRow={vi.fn()}
        registerRowRef={() => () => undefined}
      />,
    );
    expect(
      screen.getByTestId(`header-cat-${FtsFunctionCategory.METHODOLOGY}`),
    ).toBeInTheDocument();
    expect(screen.getByTestId("row-a")).toBeInTheDocument();
    expect(screen.getByTestId("row-b")).toBeInTheDocument();
  });
});
