/**
 * Class 29 — Repeated sibling JSX with pure data variation.
 *
 * SCAFFOLD (Phase 3). The detection plan:
 *
 *  1. For each JSX block (Program / JSXElement children), walk JSXElement
 *     siblings and group adjacent ones by their opening-tag signature
 *     (tag name + set of statically-valued attribute names).
 *  2. When 3+ siblings share the same signature AND most of their
 *     attribute *values* are literal (non-expression), report once at
 *     the first sibling, suggesting a `.map()` extraction.
 *
 * The all-four-must-pass test from patterns.md (count, structure, variation,
 * future shape) reduces false positives — encoded today as: same tag, 3+
 * adjacent, ≥half of attrs are constant.
 *
 * Auto-fix: hard. Skipped — emits hints only.
 *
 * Currently ships an empty visitor so the rule name is wired without
 * generating noise. Replace this with the implementation when ready.
 */
import { createRule } from "../utils/ast-helpers.ts";

type MessageIds = "siblingJsxDataVariation";

export const siblingJsxDataVariation = createRule<[], MessageIds>({
  name: "sibling-jsx-data-variation",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Class 29 — flag 3+ adjacent JSX siblings with identical opening-tag signature differing only in data values; suggest array + .map().",
    },
    schema: [],
    messages: {
      siblingJsxDataVariation:
        "Class 29: 3+ adjacent JSX siblings with identical wrapper differ only in data — extract to an array and .map() over it.",
    },
  },
  defaultOptions: [],
  create(_context) {
    // Empty visitor — see `docs/known-limitations.md` (Lint plugin gaps).
    return {};
  },
});
