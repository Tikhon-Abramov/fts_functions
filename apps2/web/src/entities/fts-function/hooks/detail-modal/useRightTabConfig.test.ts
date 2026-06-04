import { renderHook } from "@testing-library/react";
import { useRightTabConfig } from "src/entities/fts-function/hooks/detail-modal/useRightTabConfig";
import { RightTab } from "src/entities/fts-function/model";
import { describe, expect, it, vi } from "vitest";

describe("useRightTabConfig", () => {
  function args(over?: { hasSelectedRow?: boolean }) {
    return {
      hasSelectedRow: over?.hasSelectedRow ?? false,
      renderLinks: vi.fn(() => null),
      renderDetails: vi.fn(() => null),
      renderAdd: vi.fn(() => null),
      renderLinker: vi.fn(() => null),
    };
  }

  it("returns the four tabs in their canonical order (LINKS, DETAILS, ADD, LINKER)", () => {
    const { result } = renderHook(() => useRightTabConfig(args()));
    expect(result.current.map((t) => t.id)).toEqual([
      RightTab.LINKS,
      RightTab.DETAILS,
      RightTab.ADD,
      RightTab.LINKER,
    ]);
  });

  it("disables the LINKER tab when there is no selected row", () => {
    const { result } = renderHook(() =>
      useRightTabConfig(args({ hasSelectedRow: false })),
    );
    const linker = result.current.find((t) => t.id === RightTab.LINKER);
    expect(linker?.disabled).toBe(true);
  });

  it("enables the LINKER tab when a row is selected", () => {
    const { result } = renderHook(() =>
      useRightTabConfig(args({ hasSelectedRow: true })),
    );
    const linker = result.current.find((t) => t.id === RightTab.LINKER);
    expect(linker?.disabled).toBe(false);
  });

  it("every other tab is always enabled", () => {
    const { result } = renderHook(() => useRightTabConfig(args()));
    const others = result.current.filter((t) => t.id !== RightTab.LINKER);
    for (const t of others) expect(t.disabled).toBe(false);
  });
});
