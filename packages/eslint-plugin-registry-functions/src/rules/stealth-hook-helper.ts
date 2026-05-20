/**
 * Class 26 — Stealth-hook helper.
 *
 * Detects: a same-file PascalCase helper function (FunctionDeclaration with
 * a name starting with an uppercase letter) that calls a React context hook
 * (useTheme / useTranslation / useState / useEffect / useMemo / useCallback /
 * useRef / useContext / use*) inside its body, when the file's *first*
 * exported / default-exported PascalCase function (the "parent") also calls
 * the same hook.
 *
 * The smell signal: the helper pretends to be self-contained but its only
 * caller has already read the same context. Detection alone — fix is
 * structural (Pass-as-prop OR promote to its own file). Reported at the
 * helper's name location.
 */
import type { TSESTree } from "@typescript-eslint/utils";

import {
  collectHookCallsInFunction,
  createRule,
} from "../utils/ast-helpers.ts";

type MessageIds = "stealthHook";

function isPascalName(name: string | undefined): boolean {
  if (!name) return false;
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

export const stealthHookHelper = createRule<[], MessageIds>({
  name: "stealth-hook-helper",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Class 26 — flag in-file PascalCase helpers that call a React hook when the parent (default export) also calls the same hook. Helpers should take dependencies as props, or be promoted to their own file.",
    },
    schema: [],
    messages: {
      stealthHook:
        "Class 26: stealth-hook helper. `{{ helper }}` calls `{{ hook }}` but is declared in the same file as `{{ parent }}` which already has it in scope. Pass as prop or promote to a real sub-component file.",
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Program(program) {
        // Collect all top-level PascalCase functions: declarations + defaults.
        const fns: Array<{
          name: string;
          node:
            | TSESTree.FunctionDeclaration
            | TSESTree.FunctionExpression
            | TSESTree.ArrowFunctionExpression;
          isExported: boolean;
        }> = [];

        for (const stmt of program.body) {
          // function Foo() { ... }  OR  export function Foo() { ... }
          if (
            stmt.type === "FunctionDeclaration" &&
            stmt.id &&
            isPascalName(stmt.id.name)
          ) {
            fns.push({ name: stmt.id.name, node: stmt, isExported: false });
          } else if (
            stmt.type === "ExportNamedDeclaration" &&
            stmt.declaration &&
            stmt.declaration.type === "FunctionDeclaration" &&
            stmt.declaration.id &&
            isPascalName(stmt.declaration.id.name)
          ) {
            fns.push({
              name: stmt.declaration.id.name,
              node: stmt.declaration,
              isExported: true,
            });
          } else if (
            stmt.type === "ExportDefaultDeclaration" &&
            stmt.declaration.type === "FunctionDeclaration" &&
            stmt.declaration.id &&
            isPascalName(stmt.declaration.id.name)
          ) {
            fns.push({
              name: stmt.declaration.id.name,
              node: stmt.declaration,
              isExported: true,
            });
          }
        }

        if (fns.length < 2) return;

        // Heuristic: the "parent" is the first exported PascalCase fn (or
        // the first PascalCase fn if none are exported).
        const parent = fns.find((f) => f.isExported) ?? fns[0];
        if (!parent) return;
        const parentHooks = collectHookCallsInFunction(parent.node);
        if (parentHooks.size === 0) return;

        for (const fn of fns) {
          if (fn === parent) continue;
          const childHooks = collectHookCallsInFunction(fn.node);
          // Find the first hook the child shares with the parent.
          let sharedHook: string | undefined;
          for (const h of childHooks) {
            if (parentHooks.has(h)) {
              sharedHook = h;
              break;
            }
          }
          if (
            sharedHook &&
            fn.node.type === "FunctionDeclaration" &&
            fn.node.id
          ) {
            context.report({
              node: fn.node.id,
              messageId: "stealthHook",
              data: { helper: fn.name, hook: sharedHook, parent: parent.name },
            });
          }
        }
      },
    };
  },
});
