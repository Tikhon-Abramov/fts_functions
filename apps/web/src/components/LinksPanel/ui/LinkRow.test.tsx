import type { Row } from "src/entities/fts-function/types";

import { fireEvent, screen } from "@testing-library/react";
import { LinkRow } from "src/components/LinksPanel/ui/LinkRow";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
  FtsFunctionStep,
} from "src/entities/fts-function/model";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

const target: Row = {
  id: "target-1",
  step: FtsFunctionStep.OBJECT_SELECTION,
  category: FtsFunctionCategory.METHODOLOGY,
  detailText: "the link target",
  actionLabel: FtsFunctionActionType.KEEP,
};

describe("LinkRow", () => {
  it("renders the link target's testid", () => {
    renderWithProviders(
      <LinkRow
        linkId="L1"
        targetRow={target}
        onNavigate={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId("link-item-L1")).toBeInTheDocument();
  });

  it("invokes onNavigate(targetRow.id) when the row is clicked", () => {
    const onNavigate = vi.fn();
    renderWithProviders(
      <LinkRow
        linkId="L1"
        targetRow={target}
        onNavigate={onNavigate}
        onRemove={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("link-item-L1"));
    expect(onNavigate).toHaveBeenCalledWith("target-1");
  });
});
