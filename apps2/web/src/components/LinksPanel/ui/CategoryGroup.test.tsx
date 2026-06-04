import type { Row } from "src/entities/fts-function/types";

import { screen } from "@testing-library/react";
import { CategoryGroup } from "src/components/LinksPanel/ui/CategoryGroup";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

const row: Row = {
  id: "1",
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: "x",
  actionLabel: FtsFunctionActionType.KEEP,
};

const colors = { bg: "#000", border: "#fff", text: "#aaa" };

describe("CategoryGroup", () => {
  it("renders the category header testid", () => {
    renderWithProviders(
      <CategoryGroup
        category={FtsFunctionCategory.METHODOLOGY}
        items={[{ linkId: "L1", targetRow: row }]}
        colors={colors}
        onNavigate={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(`links-cat-${FtsFunctionCategory.METHODOLOGY}`),
    ).toBeInTheDocument();
  });

  it("renders one LinkRow per item", () => {
    const r2: Row = { ...row, id: "2" };
    renderWithProviders(
      <CategoryGroup
        category={FtsFunctionCategory.METHODOLOGY}
        items={[
          { linkId: "L1", targetRow: row },
          { linkId: "L2", targetRow: r2 },
        ]}
        colors={colors}
        onNavigate={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId("link-item-L1")).toBeInTheDocument();
    expect(screen.getByTestId("link-item-L2")).toBeInTheDocument();
  });
});
