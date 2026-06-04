import { renderHook } from "@testing-library/react";
import { useActionChipColors } from "src/entities/fts-function/hooks/colors/useActionChipColors";
import { useCategoryColors } from "src/entities/fts-function/hooks/colors/useCategoryColors";
import {
  FtsFunctionActionType,
  FtsFunctionCategory,
} from "src/entities/fts-function/model";
import { AllProviders } from "src/test-utils/render-with-providers";
import { describe, expect, it } from "vitest";

describe("useActionChipColors", () => {
  it("returns a record keyed by every FtsFunctionActionType code", () => {
    const { result } = renderHook(() => useActionChipColors(), {
      wrapper: AllProviders,
    });
    for (const code of Object.values(FtsFunctionActionType)) {
      const c = result.current[code];
      expect(c).toBeDefined();
      expect(typeof c.bg).toBe("string");
      expect(typeof c.color).toBe("string");
      expect(typeof c.border).toBe("string");
    }
  });
});

describe("useCategoryColors", () => {
  it("returns a record keyed by every FtsFunctionCategory code", () => {
    const { result } = renderHook(() => useCategoryColors(), {
      wrapper: AllProviders,
    });
    for (const code of Object.values(FtsFunctionCategory)) {
      const c = result.current[code];
      expect(c).toBeDefined();
      expect(typeof c.bg).toBe("string");
      expect(typeof c.border).toBe("string");
      expect(typeof c.text).toBe("string");
    }
  });
});
