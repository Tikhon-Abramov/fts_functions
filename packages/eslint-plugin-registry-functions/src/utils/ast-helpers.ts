/**
 * Shared AST helpers for the registry-functions custom rules.
 *
 * Kept tiny on purpose — heavier helpers belong inside their consuming
 * rule. These are utilities that show up in 2+ rules:
 *
 *  - `RuleCreator` factory bound to the project's docs URL.
 *  - `getCalleeName` — collapse `useTheme()`, `someObj.useTheme()`,
 *    `(useTheme as any)()` to a callee name string for hook detection.
 *  - `isReactHookName` — `use[A-Z]…` shape test.
 */
import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/registry-functions/registry-functions/blob/main/docs/patterns.md#class-${name.replace(/[^0-9]/g, "")}`,
);

export function getCalleeName(
  node: TSESTree.Expression | TSESTree.Super,
): string | null {
  switch (node.type) {
    case "Identifier":
      return node.name;
    case "MemberExpression":
      if (node.property.type === "Identifier") return node.property.name;
      return null;
    case "TSNonNullExpression":
    case "TSAsExpression":
      return getCalleeName(node.expression);
    default:
      return null;
  }
}

export function isReactHookName(name: string | null): boolean {
  if (!name) return false;
  return /^use[A-Z]/.test(name);
}

/**
 * Walk a function body and collect names of hooks called inside it.
 * Cheap traversal: ignores hooks called inside nested function declarations
 * (those are the nested function's hooks, not the parent's).
 */
export function collectHookCallsInFunction(
  fnNode:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression,
): Set<string> {
  const hooks = new Set<string>();

  function visit(
    node: TSESTree.Node | null | undefined,
    isRoot: boolean,
  ): void {
    if (!node) return;

    // Don't descend into nested function bodies (their hooks belong to them).
    if (
      !isRoot &&
      (node.type === "FunctionDeclaration" ||
        node.type === "FunctionExpression" ||
        node.type === "ArrowFunctionExpression")
    ) {
      return;
    }

    if (node.type === "CallExpression") {
      const name = getCalleeName(node.callee as TSESTree.Expression);
      if (isReactHookName(name)) hooks.add(name as string);
    }

    // Recurse into children. We deliberately walk only the structural
    // properties that contain expression / statement subtrees.
    const record = node as unknown as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (
        key === "parent" ||
        key === "loc" ||
        key === "range" ||
        key === "type"
      )
        continue;
      const child = record[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          if (c && typeof c === "object" && "type" in c)
            visit(c as TSESTree.Node, false);
        }
      } else if (child && typeof child === "object" && "type" in child) {
        visit(child as TSESTree.Node, false);
      }
    }
  }

  visit(fnNode.body, true);
  return hooks;
}

/**
 * Returns true if the given identifier name appears as the property of an
 * object pattern destructuring directly inside the function body.
 *
 * Used by stealth-hook-helper: detect that the parent component already
 * destructures `t` (from `useTranslation()`) or `c` / `theme` (from
 * `useTheme()`) so we know the dependency is in scope.
 */
export function bodyDestructuresName(
  fnNode:
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.ArrowFunctionExpression,
  names: ReadonlySet<string>,
): boolean {
  const body = fnNode.body;
  if (body.type !== "BlockStatement") return false;

  for (const stmt of body.body) {
    if (stmt.type !== "VariableDeclaration") continue;
    for (const decl of stmt.declarations) {
      if (decl.id.type === "ObjectPattern") {
        for (const prop of decl.id.properties) {
          if (
            prop.type === "Property" &&
            prop.key.type === "Identifier" &&
            names.has(prop.key.name)
          ) {
            return true;
          }
        }
      }
      // Also: const c = theme.custom; where theme came from useTheme().
      if (
        decl.id.type === "Identifier" &&
        decl.init &&
        decl.init.type === "MemberExpression" &&
        decl.init.object.type === "Identifier" &&
        names.has(decl.init.object.name)
      ) {
        return true;
      }
    }
  }
  return false;
}
