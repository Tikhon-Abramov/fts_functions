/**
 * INTEGRATION REGRESSION TEST — AddItemForm mount lifecycle.
 *
 * Tonight's bug: opening the detailization modal crashed with
 *   "Cannot read properties of undefined (reading 'trim')"
 * because RHF's `useWatch` returns `undefined` for nested object fields
 * for one render between mount and defaults propagating, and
 * `isStepFilled` (and `s1.category` reads) assumed the object existed.
 *
 * The fix added explicit `defaultValue: emptyStep()` on each `useWatch`
 * AND made `isStepFilled` accept `undefined`. This test mounts the form
 * cold, with an empty allRows list, and asserts:
 *   1. No exception is thrown on first paint.
 *   2. The Step-1 / Step-2 tab buttons render with their default (unfilled) state.
 *   3. The Save button is rendered (disabled) as the dual / single label.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddItemForm from "src/components/AddItemForm/AddItemForm";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

describe("AddItemForm — mount lifecycle (REGRESSION)", () => {
  it("renders without crashing when allRows is empty", () => {
    expect(() =>
      renderWithProviders(
        <AddItemForm
          allRows={[]}
          onSaveSingle={vi.fn().mockReturnValue("new-id")}
          onSaveDual={vi.fn()}
          onQuickLink={vi.fn()}
        />,
      ),
    ).not.toThrow();
  });

  it("renders both step tabs in their default unfilled state", () => {
    renderWithProviders(
      <AddItemForm
        allRows={[]}
        onSaveSingle={vi.fn().mockReturnValue("new-id")}
        onSaveDual={vi.fn()}
        onQuickLink={vi.fn()}
      />,
    );
    expect(screen.getByTestId("button-step-1")).toBeInTheDocument();
    expect(screen.getByTestId("button-step-2")).toBeInTheDocument();
    // Neither step should show the OK chip on first paint.
    expect(screen.queryByTestId("chip-filled-step-1")).toBeNull();
    expect(screen.queryByTestId("chip-filled-step-2")).toBeNull();
  });

  it("renders the save button (single variant when nothing is filled) and it is disabled", () => {
    renderWithProviders(
      <AddItemForm
        allRows={[]}
        onSaveSingle={vi.fn().mockReturnValue("new-id")}
        onSaveDual={vi.fn()}
        onQuickLink={vi.fn()}
      />,
    );
    const saveBtn = screen.getByTestId("button-save-single");
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
  });

  it("enables the save button once the active step's detailText is filled", async () => {
    renderWithProviders(
      <AddItemForm
        allRows={[]}
        onSaveSingle={vi.fn().mockReturnValue("new-id")}
        onSaveDual={vi.fn()}
        onQuickLink={vi.fn()}
      />,
    );
    expect(screen.getByTestId("button-save-single")).toBeDisabled();

    // Both step bodies are mounted; the active one (s1 by default) has its
    // textarea inside `add-detail-text-s1`.
    const textarea = screen
      .getByTestId("add-detail-text-s1")
      .querySelector("textarea");
    expect(textarea).not.toBeNull();

    const user = userEvent.setup();
    await user.type(textarea!, "Подобрать объект");

    await waitFor(() => {
      expect(screen.getByTestId("button-save-single")).toBeEnabled();
    });
  });
});

/**
 * REGRESSION GUARD — submit must actually fire the save callback.
 *
 * Bug history: clicking "Сохранить" silently no-op'd because the form was
 * wired through `handleSubmit(callback)` with a zod resolver that required
 * BOTH s1 and s2 to be fully-populated objects. Tab switches briefly
 * unmounted the inactive step's Controllers, RHF saw `s2: undefined`,
 * `formState.isValid` stayed false, and the callback never ran.
 *
 * These tests lock in the contract: when the user fills a step's
 * detailText and clicks Save, the appropriate callback fires with the
 * right `step` discriminator. Any future refactor that re-introduces a
 * silent-no-op submit path will fail here, in CI, instead of in prod.
 */
describe("AddItemForm — save callbacks (REGRESSION: silent no-op)", () => {
  const fillStepDetail = async (
    step: "s1" | "s2",
    text: string,
  ): Promise<void> => {
    const textarea = screen
      .getByTestId(`add-detail-text-${step}`)
      .querySelector("textarea");
    if (!textarea) throw new Error(`textarea for ${step} not found`);
    await userEvent.setup().type(textarea, text);
  };

  it("fires onSaveSingle with step=OBJECT_SELECTION when only Step 1 is filled", async () => {
    const onSaveSingle = vi.fn().mockReturnValue("row-1");
    const onSaveDual = vi.fn();
    renderWithProviders(
      <AddItemForm
        allRows={[]}
        onSaveSingle={onSaveSingle}
        onSaveDual={onSaveDual}
        onQuickLink={vi.fn()}
      />,
    );
    await fillStepDetail("s1", "Шаг 1 текст");

    const saveBtn = await screen.findByTestId("button-save-single");
    await waitFor(() => expect(saveBtn).toBeEnabled());
    await userEvent.setup().click(saveBtn);

    await waitFor(() => expect(onSaveSingle).toHaveBeenCalledTimes(1));
    expect(onSaveDual).not.toHaveBeenCalled();
    const arg = onSaveSingle.mock.calls[0][0];
    expect(arg.step).toBe("OBJECT_SELECTION");
    expect(arg.detailText).toBe("Шаг 1 текст");
  });

  it("fires onSaveSingle with step=CLUSTERING_IMPACT when only Step 2 is filled", async () => {
    const onSaveSingle = vi.fn().mockReturnValue("row-2");
    const onSaveDual = vi.fn();
    renderWithProviders(
      <AddItemForm
        allRows={[]}
        onSaveSingle={onSaveSingle}
        onSaveDual={onSaveDual}
        onQuickLink={vi.fn()}
      />,
    );

    await fillStepDetail("s2", "Шаг 2 текст");

    const user = userEvent.setup();
    const saveBtn = await screen.findByTestId("button-save-single");
    await waitFor(() => expect(saveBtn).toBeEnabled());
    await user.click(saveBtn);

    await waitFor(() => expect(onSaveSingle).toHaveBeenCalledTimes(1));
    expect(onSaveDual).not.toHaveBeenCalled();
    const arg = onSaveSingle.mock.calls[0][0];
    expect(arg.step).toBe("CLUSTERING_IMPACT");
    expect(arg.detailText).toBe("Шаг 2 текст");
  });

  it("fires onSaveDual when BOTH steps are filled, never onSaveSingle", async () => {
    const onSaveSingle = vi.fn().mockReturnValue("row-x");
    const onSaveDual = vi.fn();
    renderWithProviders(
      <AddItemForm
        allRows={[]}
        onSaveSingle={onSaveSingle}
        onSaveDual={onSaveDual}
        onQuickLink={vi.fn()}
      />,
    );

    await fillStepDetail("s1", "Шаг 1 текст");
    await fillStepDetail("s2", "Шаг 2 текст");

    const user = userEvent.setup();
    const saveBtn = await screen.findByTestId("button-save-dual");
    await waitFor(() => expect(saveBtn).toBeEnabled());
    await user.click(saveBtn);

    await waitFor(() => expect(onSaveDual).toHaveBeenCalledTimes(1));
    expect(onSaveSingle).not.toHaveBeenCalled();
    const [s1Arg, s2Arg] = onSaveDual.mock.calls[0];
    expect(s1Arg.detailText).toBe("Шаг 1 текст");
    expect(s2Arg.detailText).toBe("Шаг 2 текст");
  });
});
