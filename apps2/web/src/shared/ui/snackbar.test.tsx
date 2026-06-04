import { act, render, renderHook, screen } from "@testing-library/react";
import {
  setGlobalSnackbarHandler,
  showGlobalError,
  showGlobalMessage,
  SnackbarProvider,
  SnackbarSeverity,
  useSnackbar,
} from "src/shared/ui/snackbar";
import { afterEach, describe, expect, it } from "vitest";

describe("SnackbarProvider + useSnackbar", () => {
  afterEach(() => setGlobalSnackbarHandler(null));

  it("useSnackbar throws when used outside the provider", () => {
    expect(() => renderHook(() => useSnackbar())).toThrowError(
      /SnackbarProvider/,
    );
  });

  it("provides showMessage / showError that mount an Alert", () => {
    function Stub() {
      const { showMessage } = useSnackbar();
      return (
        <button onClick={() => showMessage("Hello", SnackbarSeverity.INFO)}>
          msg
        </button>
      );
    }
    render(
      <SnackbarProvider>
        <Stub />
      </SnackbarProvider>,
    );
    act(() => screen.getByRole("button").click());
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("setGlobalSnackbarHandler routes external calls through the provider", () => {
    render(
      <SnackbarProvider>
        <div />
      </SnackbarProvider>,
    );
    act(() => showGlobalMessage("Global"));
    expect(screen.getByText("Global")).toBeInTheDocument();
  });

  it("showGlobalError no-ops when no provider is mounted", () => {
    setGlobalSnackbarHandler(null);
    expect(() => showGlobalError("ignored")).not.toThrow();
  });

  it("queues subsequent messages while one is open", () => {
    function Stub() {
      const { showMessage } = useSnackbar();
      return (
        <>
          <button data-testid="m1" onClick={() => showMessage("first-msg")}>
            x
          </button>
          <button data-testid="m2" onClick={() => showMessage("second-msg")}>
            y
          </button>
        </>
      );
    }
    render(
      <SnackbarProvider>
        <Stub />
      </SnackbarProvider>,
    );
    act(() => screen.getByTestId("m1").click());
    act(() => screen.getByTestId("m2").click());
    // First message stays visible; second is queued.
    expect(screen.getByText("first-msg")).toBeInTheDocument();
    expect(screen.queryByText("second-msg")).toBeNull();
  });
});
