/**
 * Class 23 — Boolean-discriminated styling inline instead of variant lookup.
 *
 * Detects: a JSX `sx={{ ... cond ? a : b }}` (spread of a ternary) inside a
 * JSX element AND a sibling JSX element of the same tag with the same
 * shape. The pair is the strongest signal — copy-paste of paired styling.
 *
 * What we report (today): every JSX `sx={{ ...(cond ? a : b) }}` where
 * `cond` is a simple identifier expression. The "sibling pair" half is
 * left as a refinement (currently the rule fires on each occurrence,
 * giving the reviewer the same signal at slightly higher noise — a
 * reasonable trade for a first cut).
 *
 * Auto-fix: not safe without knowing the variant registry. Detection only.
 */
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/ast-helpers.ts";

type MessageIds = "pairedTernarySx";

export const pairedTernaryStyling = createRule<[], MessageIds>({
  name: "paired-ternary-styling",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Class 23 — flag sx={{ ...(cond ? a : b) }} ternary spreads. Extract a helper that resolves the variant from a discriminator prop instead.",
    },
    schema: [],
    messages: {
      pairedTernarySx:
        "Class 23: paired-ternary styling — extract a variant-resolving helper component instead of inlining `sx={{ ...(cond ? a : b) }}`.",
    },
  },
  defaultOptions: [],
  create(context) {
    function isTernarySpreadInsideObject(
      node: TSESTree.ObjectExpression,
    ): boolean {
      for (const prop of node.properties) {
        if (
          prop.type === "SpreadElement" &&
          prop.argument.type === "ConditionalExpression"
        ) {
          return true;
        }
      }
      return false;
    }

    return {
      JSXAttribute(node) {
        if (
          node.name.type !== "JSXIdentifier" ||
          node.name.name !== "sx" ||
          !node.value ||
          node.value.type !== "JSXExpressionContainer"
        ) {
          return;
        }
        const expr = node.value.expression;
        if (expr.type !== "ObjectExpression") return;
        if (isTernarySpreadInsideObject(expr)) {
          context.report({ node, messageId: "pairedTernarySx" });
        }
      },
    };
  },
});
