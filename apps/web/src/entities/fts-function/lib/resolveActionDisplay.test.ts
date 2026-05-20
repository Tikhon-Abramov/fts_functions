import type { TFunction } from "i18next";

import { resolveActionDisplay } from "src/entities/fts-function/lib/resolveActionDisplay";
import { FtsFunctionActionType } from "src/entities/fts-function/model";
import { describe, expect, it, vi } from "vitest";

describe("resolveActionDisplay", () => {
  // Mock TFunction: returns the key it was given so we can assert the
  // resolver picked the right i18n key.
  const t = vi.fn((key: string) => key) as unknown as TFunction;

  it("returns the action.notSet label when the action is undefined", () => {
    expect(resolveActionDisplay(t, undefined)).toBe("action.notSet");
  });

  it("returns the action.notSet label when the action is the empty string", () => {
    expect(resolveActionDisplay(t, "")).toBe("action.notSet");
  });

  it("looks up the right i18n key per action code", () => {
    expect(resolveActionDisplay(t, FtsFunctionActionType.KEEP)).toBe(
      "action.keep",
    );
    expect(resolveActionDisplay(t, FtsFunctionActionType.TRANSFER)).toBe(
      "action.transfer",
    );
    expect(resolveActionDisplay(t, FtsFunctionActionType.OPTIMIZE)).toBe(
      "action.optimize",
    );
    expect(
      resolveActionDisplay(t, FtsFunctionActionType.OPTIMIZE_TRANSFER),
    ).toBe("action.optimizeTransfer");
    expect(resolveActionDisplay(t, FtsFunctionActionType.REMOVE)).toBe(
      "action.remove",
    );
  });
});
