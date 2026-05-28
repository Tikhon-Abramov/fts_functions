import { screen } from "@testing-library/react";
import { DetailRightPanel } from "src/components/DetailizationModal/ui/header/DetailRightPanel";
import { RightTab } from "src/entities/fts-function/model";
import { I18N } from "src/shared/i18n";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

describe("DetailRightPanel", () => {
  it("renders the active tab's body", () => {
    renderWithProviders(
      <DetailRightPanel
        rightTab={RightTab.DETAILS}
        tabs={[
          {
            id: RightTab.DETAILS,
            i18nKey: I18N.modal.tabs.details,
            testId: "tab-details",
            disabled: false,
            render: () => <div data-testid="details-body">DETAILS</div>,
          },
          {
            id: RightTab.LINKS,
            i18nKey: I18N.modal.tabs.links,
            testId: "tab-links",
            disabled: false,
            render: () => <div data-testid="links-body">LINKS</div>,
          },
        ]}
        onTabChange={vi.fn()}
      />,
    );
    expect(screen.getByTestId("details-body")).toBeInTheDocument();
    expect(screen.queryByTestId("links-body")).toBeNull();
  });

  it("renders nothing in the body when no tab matches", () => {
    renderWithProviders(
      <DetailRightPanel
        rightTab={999 as unknown as RightTab}
        tabs={[]}
        onTabChange={vi.fn()}
      />,
    );
    // No body content but no crash.
    expect(screen.queryByText("DETAILS")).toBeNull();
  });
});
