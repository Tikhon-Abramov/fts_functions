import { fireEvent, screen } from "@testing-library/react";
import {
  FUNCTION_FORM_ACTIONS_TEST_IDS,
  FunctionFormActions,
} from "src/components/FunctionFormPanel/ui/FunctionFormActions";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

describe("FunctionFormActions", () => {
  it("create-mode: renders Save + Clear, save disabled when invalid", () => {
    renderWithProviders(
      <FunctionFormActions
        isEdit={false}
        valid={false}
        isDirty={false}
        submitting={false}
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.SAVE),
    ).toBeDisabled();
    expect(
      screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.CLEAR),
    ).toBeInTheDocument();
  });

  it("create-mode: save button enabled when valid", () => {
    renderWithProviders(
      <FunctionFormActions
        isEdit={false}
        valid
        isDirty={false}
        submitting={false}
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.SAVE),
    ).not.toBeDisabled();
  });

  it("edit-mode (REGRESSION: dirty-detection): save disabled when valid but not dirty", () => {
    renderWithProviders(
      <FunctionFormActions
        isEdit
        valid
        isDirty={false}
        submitting={false}
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.SAVE),
    ).toBeDisabled();
  });

  it("edit-mode: save enabled when valid AND dirty", () => {
    renderWithProviders(
      <FunctionFormActions
        isEdit
        valid
        isDirty
        submitting={false}
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.SAVE),
    ).not.toBeDisabled();
  });

  it("edit-mode: shows Cancel (not Clear)", () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <FunctionFormActions
        isEdit
        valid
        isDirty
        submitting={false}
        onClear={vi.fn()}
        onCancel={onCancel}
      />,
    );
    expect(
      screen.queryByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.CLEAR),
    ).toBeNull();
    fireEvent.click(screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.CANCEL));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("create-mode Clear button fires onClear", () => {
    const onClear = vi.fn();
    renderWithProviders(
      <FunctionFormActions
        isEdit={false}
        valid
        isDirty
        submitting={false}
        onClear={onClear}
        onCancel={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.CLEAR));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("save disabled while submitting regardless of validity", () => {
    renderWithProviders(
      <FunctionFormActions
        isEdit={false}
        valid
        isDirty
        submitting
        onClear={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(FUNCTION_FORM_ACTIONS_TEST_IDS.SAVE),
    ).toBeDisabled();
  });
});
