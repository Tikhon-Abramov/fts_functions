import { fireEvent, screen } from "@testing-library/react";
import {
  DETAIL_HEADER_TEST_IDS,
  DetailHeader,
} from "src/components/DetailizationModal/ui/header/DetailHeader";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

describe("DetailHeader", () => {
  it("renders the title, subtitle, and three count chips", () => {
    renderWithProviders(
      <DetailHeader
        title="Function 42"
        step1Count={3}
        step2Count={5}
        linkCount={2}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(DETAIL_HEADER_TEST_IDS.TITLE),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(DETAIL_HEADER_TEST_IDS.SUBTITLE),
    ).toHaveTextContent("Function 42");
    expect(
      screen.getByTestId(DETAIL_HEADER_TEST_IDS.STEP1_COUNT),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(DETAIL_HEADER_TEST_IDS.STEP2_COUNT),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(DETAIL_HEADER_TEST_IDS.LINK_COUNT),
    ).toBeInTheDocument();
  });

  it("invokes onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    renderWithProviders(
      <DetailHeader
        title="x"
        step1Count={0}
        step2Count={0}
        linkCount={0}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId(DETAIL_HEADER_TEST_IDS.CLOSE));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
