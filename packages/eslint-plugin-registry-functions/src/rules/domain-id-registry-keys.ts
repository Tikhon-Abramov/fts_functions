/**
 * Class 27 — Literal property keys for domain-meaningful identifiers.
 *
 * Detection (W10, partial implementation): walk ObjectExpressions whose
 * contextual TS type is `Record<keyof T, ...>` or
 * `Partial<Record<keyof T, ...>>`. If any Property has a string-literal /
 * Identifier key, report — the codebase convention is that
 * domain-meaningful keys flow through a `[REGISTRY.VARIANT]:` computed
 * key, not a bare literal.
 *
 * What we do NOT do here: cross-reference an indexed registry
 * (`export const X = {…} as const`) and only fire when one is known to
 * exist. That requires reading every `model/` directory at lint-time and
 * is deferred. The current shape — "if your literal-keyed object is
 * typed by `keyof T`, you almost certainly have a registry already" —
 * is the documented heuristic in patterns.md §Class 27. False
 * positives are addressable per-call with an eslint-disable-line plus
 * a doc comment, the same way we treat the documented exception
 * categories.
 *
 * Auto-fix: not safe — we don't know which registry maps to the literal
 * key. Reporting only.
 */
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/ast-helpers.ts";

type MessageIds = "domainIdRegistryKeys";

/**
 * Walk a TS type-reference AST node and decide whether it is a
 * `Record<keyof T, ...>` or `Partial<Record<keyof T, ...>>` shape.
 *
 * We intentionally only inspect the structural type AST — no
 * type-checker required — so the rule runs on any ESLint config
 * without project info.
 */
function isRecordKeyofType(typeNode: TSESTree.TypeNode | undefined): boolean {
  if (!typeNode) return false;

  // Unwrap `Partial<...>`
  if (
    typeNode.type === "TSTypeReference" &&
    typeNode.typeName.type === "Identifier" &&
    typeNode.typeName.name === "Partial" &&
    typeNode.typeArguments &&
    typeNode.typeArguments.params.length === 1
  ) {
    return isRecordKeyofType(typeNode.typeArguments.params[0]);
  }

  // `Record<keyof T, V>` — first type arg must be `keyof <something>`.
  if (
    typeNode.type === "TSTypeReference" &&
    typeNode.typeName.type === "Identifier" &&
    typeNode.typeName.name === "Record" &&
    typeNode.typeArguments &&
    typeNode.typeArguments.params.length >= 1
  ) {
    const firstParam = typeNode.typeArguments.params[0];
    if (
      firstParam &&
      firstParam.type === "TSTypeOperator" &&
      firstParam.operator === "keyof"
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Look at the immediate parent of an ObjectExpression and return the
 * type-annotation node, if any, that types it.
 */
function getContextualTypeNode(
  obj: TSESTree.ObjectExpression,
): TSESTree.TypeNode | undefined {
  const parent = obj.parent;
  if (!parent) return undefined;

  // `const X: T = { ... }`
  if (
    parent.type === "VariableDeclarator" &&
    parent.init === obj &&
    parent.id.type === "Identifier" &&
    parent.id.typeAnnotation
  ) {
    return parent.id.typeAnnotation.typeAnnotation;
  }

  // `{ ... } as T`  /  `{ ... } satisfies T`
  if (
    (parent.type === "TSAsExpression" ||
      parent.type === "TSSatisfiesExpression") &&
    parent.expression === obj
  ) {
    return parent.typeAnnotation;
  }

  return undefined;
}

function getLiteralKeyName(
  prop: TSESTree.Property | TSESTree.RestElement | TSESTree.SpreadElement,
): string | null {
  if (prop.type !== "Property") return null;
  if (prop.computed) return null;
  if (prop.key.type === "Identifier") return prop.key.name;
  if (prop.key.type === "Literal" && typeof prop.key.value === "string") {
    return prop.key.value;
  }
  return null;
}

export const domainIdRegistryKeys = createRule<[], MessageIds>({
  name: "domain-id-registry-keys",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Class 27 — flag `Record<keyof T, ...>` literals using string-literal keys when a registry exists for the concept; prefer computed `[REGISTRY.VARIANT]` keys.",
    },
    schema: [],
    messages: {
      domainIdRegistryKeys:
        "Class 27: domain-meaningful identifier as literal key. Use the registry: `[REGISTRY.{{ key }}]: …` instead of `{{ key }}: …`.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      ObjectExpression(node) {
        const typeNode = getContextualTypeNode(node);
        if (!isRecordKeyofType(typeNode)) return;

        for (const prop of node.properties) {
          const keyName = getLiteralKeyName(prop);
          if (keyName == null) continue;
          context.report({
            node: prop,
            messageId: "domainIdRegistryKeys",
            data: { key: keyName },
          });
        }
      },
    };
  },
});
