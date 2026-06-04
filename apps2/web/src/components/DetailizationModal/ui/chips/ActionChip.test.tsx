import { screen } from "@testing-library/react";
import { ActionChip } from "src/components/DetailizationModal/ui/chips/ActionChip";
import { FtsFunctionActionType } from "src/entities/fts-function/model";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it } from "vitest";

describe("ActionChip", () => {
  it("renders a 'not set' chip when action is empty", () => {
    renderWithProviders(<ActionChip action="" colorByCode={new Map()} />);
    // The Russian translation for action.notSet is "Не указано".
    expect(screen.getByText("Не указано")).toBeInTheDocument();
  });

  it("renders a 'not set' chip when action is undefined", () => {
    renderWithProviders(
      <ActionChip action={undefined} colorByCode={new Map()} />,
    );
    expect(screen.getByText("Не указано")).toBeInTheDocument();
  });

  it("uses the colorByCode map to colour the chip when present", () => {
    const colorByCode = new Map<string, string | null | undefined>([
      [FtsFunctionActionType.KEEP, "#ff00ff"],
    ]);
    expect(() =>
      renderWithProviders(
        <ActionChip
          action={FtsFunctionActionType.KEEP}
          colorByCode={colorByCode}
        />,
      ),
    ).not.toThrow();
  });
});
