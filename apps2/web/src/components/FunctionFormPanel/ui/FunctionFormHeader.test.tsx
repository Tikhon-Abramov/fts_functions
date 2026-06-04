import { fireEvent, screen } from "@testing-library/react";
import {
  FUNCTION_FORM_HEADER_TEST_IDS,
  FunctionFormHeader,
} from "src/components/FunctionFormPanel/ui/FunctionFormHeader";
import { renderWithProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it, vi } from "vitest";

describe("FunctionFormHeader", () => {
  it("renders the title and toggle button", () => {
    renderWithProviders(
      <FunctionFormHeader
        title="My title"
        icon={<span>icon</span>}
        expanded={false}
        isEdit={false}
        showHint
        onToggle={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByTestId(FUNCTION_FORM_HEADER_TEST_IDS.TITLE),
    ).toHaveTextContent("My title");
    expect(
      screen.getByTestId(FUNCTION_FORM_HEADER_TEST_IDS.TOGGLE_BUTTON),
    ).toBeInTheDocument();
  });

  it("does NOT render the close button when isEdit=false", () => {
    renderWithProviders(
      <FunctionFormHeader
        title="x"
        icon={<span />}
        expanded={false}
        isEdit={false}
        showHint={false}
        onToggle={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.queryByTestId(FUNCTION_FORM_HEADER_TEST_IDS.CLOSE),
    ).toBeNull();
  });

  it("renders the close button when isEdit=true and fires onClose without triggering onToggle", () => {
    const onClose = vi.fn();
    const onToggle = vi.fn();
    renderWithProviders(
      <FunctionFormHeader
        title="x"
        icon={<span />}
        expanded
        isEdit
        showHint={false}
        onToggle={onToggle}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByTestId(FUNCTION_FORM_HEADER_TEST_IDS.CLOSE));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("clicking the toggle bar fires onToggle", () => {
    const onToggle = vi.fn();
    renderWithProviders(
      <FunctionFormHeader
        title="x"
        icon={<span />}
        expanded={false}
        isEdit={false}
        showHint={false}
        onToggle={onToggle}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId(FUNCTION_FORM_HEADER_TEST_IDS.TOGGLE));
    expect(onToggle).toHaveBeenCalled();
  });

  it("renders the audit timestamp inline when expanded with audit data", () => {
    renderWithProviders(
      <FunctionFormHeader
        title="x"
        icon={<span />}
        expanded
        isEdit
        showHint={false}
        onToggle={vi.fn()}
        onClose={vi.fn()}
        audit={{
          createdAt: "2026-04-26T02:47:00.000Z",
          updatedAt: "2026-04-26T02:47:00.000Z",
        }}
      />,
    );
    const audit = screen.getByTestId(FUNCTION_FORM_HEADER_TEST_IDS.AUDIT);
    expect(audit).toHaveTextContent("Создано");
    // Don't pin the formatted hour: timezone shifts in CI vs local change it.
    expect(audit.textContent).toMatch(
      /Создано\s*\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}/,
    );
    // Same created/updated → only one entry, no "Обновлено".
    expect(audit).not.toHaveTextContent("Обновлено");
  });

  it("shows both Создано and Обновлено when timestamps differ", () => {
    renderWithProviders(
      <FunctionFormHeader
        title="x"
        icon={<span />}
        expanded
        isEdit
        showHint={false}
        onToggle={vi.fn()}
        onClose={vi.fn()}
        audit={{
          createdAt: "2026-04-26T02:47:00.000Z",
          updatedAt: "2026-04-27T14:12:00.000Z",
        }}
      />,
    );
    const audit = screen.getByTestId(FUNCTION_FORM_HEADER_TEST_IDS.AUDIT);
    expect(audit).toHaveTextContent("Создано");
    expect(audit).toHaveTextContent("Обновлено");
  });

  it("hides the audit block when collapsed even if audit is provided", () => {
    renderWithProviders(
      <FunctionFormHeader
        title="x"
        icon={<span />}
        expanded={false}
        isEdit
        showHint={false}
        onToggle={vi.fn()}
        onClose={vi.fn()}
        audit={{
          createdAt: "2026-04-26T02:47:00.000Z",
          updatedAt: "2026-04-26T02:47:00.000Z",
        }}
      />,
    );
    expect(
      screen.queryByTestId(FUNCTION_FORM_HEADER_TEST_IDS.AUDIT),
    ).toBeNull();
  });

  it("hides the audit block in create mode (no audit prop)", () => {
    renderWithProviders(
      <FunctionFormHeader
        title="x"
        icon={<span />}
        expanded
        isEdit={false}
        showHint={false}
        onToggle={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.queryByTestId(FUNCTION_FORM_HEADER_TEST_IDS.AUDIT),
    ).toBeNull();
  });
});
