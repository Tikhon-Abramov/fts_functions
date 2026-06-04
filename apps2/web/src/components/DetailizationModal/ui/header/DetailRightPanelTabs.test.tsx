import type { RightTabDef } from "src/entities/fts-function/hooks/detail-modal/useRightTabConfig";

import { fireEvent, screen } from "@testing-library/react";
import { DetailRightPanelTabs } from "src/components/DetailizationModal/ui/header/DetailRightPanelTabs";
import { RightTab } from "src/entities/fts-function/model";
import { I18N } from "src/shared/i18n";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

const tabs: RightTabDef[] = [
  {
    id: RightTab.LINKS,
    i18nKey: I18N.modal.tabs.links,
    testId: "tab-links",
    disabled: false,
    render: () => null,
  },
  {
    id: RightTab.DETAILS,
    i18nKey: I18N.modal.tabs.details,
    testId: "tab-details",
    disabled: false,
    render: () => null,
  },
  {
    id: RightTab.LINKER,
    i18nKey: I18N.modal.tabs.bind,
    testId: "tab-link-picker",
    disabled: true,
    render: () => null,
  },
];

describe("DetailRightPanelTabs", () => {
  it("renders one Tab per config entry", () => {
    renderWithProviders(
      <DetailRightPanelTabs
        value={RightTab.DETAILS}
        tabs={tabs}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("tab-links")).toBeInTheDocument();
    expect(screen.getByTestId("tab-details")).toBeInTheDocument();
    expect(screen.getByTestId("tab-link-picker")).toBeInTheDocument();
  });

  it("disables the tab whose config has disabled=true", () => {
    renderWithProviders(
      <DetailRightPanelTabs
        value={RightTab.DETAILS}
        tabs={tabs}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("tab-link-picker")).toBeDisabled();
  });

  it("calls onChange with the new tab id when an enabled tab is clicked", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <DetailRightPanelTabs
        value={RightTab.DETAILS}
        tabs={tabs}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByTestId("tab-links"));
    expect(onChange).toHaveBeenCalledWith(RightTab.LINKS);
  });
});
