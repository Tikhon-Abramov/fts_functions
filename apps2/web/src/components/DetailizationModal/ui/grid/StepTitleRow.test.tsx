import { screen } from "@testing-library/react";
import { StepTitleRow } from "src/components/DetailizationModal/ui/grid/StepTitleRow";
import { FtsFunctionStep } from "src/entities/fts-function/model";
import { I18N } from "src/shared/i18n";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it } from "vitest";

describe("StepTitleRow", () => {
  it("renders both step titles using their assigned testIds", () => {
    renderWithProviders(
      <StepTitleRow
        step1={{
          kind: FtsFunctionStep.OBJECT_SELECTION,
          titleI18n: I18N.modal.step1Title,
          testId: "title-step1",
        }}
        step2={{
          kind: FtsFunctionStep.CLUSTERING_IMPACT,
          titleI18n: I18N.modal.step2Title,
          testId: "title-step2",
        }}
      />,
    );
    expect(screen.getByTestId("title-step1")).toBeInTheDocument();
    expect(screen.getByTestId("title-step2")).toBeInTheDocument();
  });
});
