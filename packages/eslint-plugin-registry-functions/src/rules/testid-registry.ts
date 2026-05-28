/**
 * Class 32 — Test-id strings without a registry.
 *
 * SCAFFOLD (Phase 3). The detection plan:
 *
 *  1. Find every JSXAttribute `data-testid="<literal>"`.
 *  2. Resolve the sibling test file (same directory, `<base>.test.tsx`
 *     or `<base>.spec.tsx`) and check whether the literal also appears
 *     as `getByTestId("<literal>")` / `findByTestId(…)` /
 *     `page.getByTestId(…)`.
 *  3. If yes AND the component file does NOT export a `*_TEST_IDS` const
 *     containing that string → report.
 *
 * Implementation deferred: requires a fs read of the sibling test file
 * (allowed per ESLint rule API via `context.getFilename()` + node fs).
 * For v1, a simpler form is to flag any component with 2+ literal
 * `data-testid` attributes that aren't sourced from a registry — that
 * ports the convention without needing the test-side cross-reference.
 *
 * Currently ships an empty visitor.
 */
import { createRule } from "../utils/ast-helpers.ts";

type MessageIds = "testidRegistry";

export const testidRegistry = createRule<[], MessageIds>({
  name: "testid-registry",
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Class 32 — flag `data-testid="…"` literals also used by sibling test files; prefer an inline `*_TEST_IDS` registry exported from the component.',
    },
    schema: [],
    messages: {
      testidRegistry:
        "Class 32: hardcoded data-testid `{{ value }}` is referenced by a sibling test. Export a `*_TEST_IDS` registry from this file and reference it from both sides.",
    },
  },
  defaultOptions: [],
  create(_context) {
    // Empty visitor — see `docs/known-limitations.md` (Lint plugin gaps).
    return {};
  },
});
