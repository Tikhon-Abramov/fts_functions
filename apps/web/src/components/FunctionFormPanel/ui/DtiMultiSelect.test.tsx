import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useForm } from "react-hook-form";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DtiMultiSelect } from "src/components/FunctionFormPanel/ui/DtiMultiSelect";
import {
  EMPTY_FUNCTION_FORM,
  type FunctionFormFields,
} from "src/entities/fts-function/lib/function-form-schema";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it } from "vitest";

const sampleDtis: TypeResponseDto[] = [
  {
    id: 1,
    code: "DTI_A",
    name: "DTI A",
    description: null,
    supertypeId: null,
    category: "FTS_DTI",
    color: "#aaa",
  },
  {
    id: 2,
    code: "DTI_B",
    name: "DTI B",
    description: null,
    supertypeId: null,
    category: "FTS_DTI",
    color: "#bbb",
  },
];

function Harness({ initial }: { initial: string[] }) {
  const { control } = useForm<FunctionFormFields>({
    defaultValues: { ...EMPTY_FUNCTION_FORM, strategyProjectIds: initial },
  });
  return <DtiMultiSelect control={control} dtis={sampleDtis} />;
}

describe("DtiMultiSelect", () => {
  it("renders a delete handler on baseline chips (no locked branch)", async () => {
    renderWithProviders(<Harness initial={["1", "2"]} />);
    // Selected items render as DtiRow nodes tagged with `data-type-code`.
    const rowA = screen
      .getByText("DTI A")
      .closest('[data-type-code="DTI_A"]') as HTMLElement;
    const rowB = screen
      .getByText("DTI B")
      .closest('[data-type-code="DTI_B"]') as HTMLElement;
    expect(rowA).not.toBeNull();
    expect(rowB).not.toBeNull();
    // Each row includes an "Удалить" IconButton (aria-label) — the user-facing
    // delete handle. Asserting the button presence is the stable contract;
    // MUI internal class names are intentionally not relied on.
    const deleteA = within(rowA).getByRole("button", { name: "Удалить" });
    const deleteB = within(rowB).getByRole("button", { name: "Удалить" });
    expect(deleteA).not.toBeNull();
    expect(deleteB).not.toBeNull();
    // Sanity: clicking the delete control is wired and removes the row.
    await userEvent.click(deleteA);
    expect(
      screen.queryByText("DTI A")?.closest('[data-type-code="DTI_A"]'),
    ).toBeFalsy();
    // The other row remains.
    expect(
      screen.getByText("DTI B").closest('[data-type-code="DTI_B"]'),
    ).not.toBeNull();
  });

  it("does not render the legacy 'удаление будет реализовано позже' tooltip", () => {
    renderWithProviders(<Harness initial={["1"]} />);
    expect(screen.queryByText(/Удаление будет реализовано позже/i)).toBeNull();
  });
});
