/**
 * Class 30 — Props destructuring location.
 *
 * Detects: `function ComponentName(props: Type) { const { ... } = props; ... }`
 *
 * The rule fires when:
 *   - The function is a top-level FunctionDeclaration with a PascalCase name.
 *   - It has exactly one parameter, and that parameter is an Identifier
 *     (`props` / similar) with a TS type annotation.
 *   - The first statement in the body is `const { ... } = props;` referring
 *     to that same parameter.
 *
 * Fix shape (manual): destructure in the signature instead.
 *   `function Component({ a, b }: Props) { ... }`
 *
 * Auto-fix: skipped — the textual rewrite has corner cases (preserving
 * trailing commas, JSDoc on the parameter, type-narrowed re-assignments
 * to props). Detection-only is enough signal for review.
 */
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/ast-helpers.ts";

type MessageIds = "propsDestructureInBody";

function isPascal(name: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(name);
}

export const propsDestructureLocation = createRule<[], MessageIds>({
  name: "props-destructure-location",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Class 30 — flag `function X(props: Y) { const { ... } = props; ... }`. Destructure in the signature: `function X({ a, b }: Y) { ... }`.",
    },
    schema: [],
    messages: {
      propsDestructureInBody:
        "Class 30: destructure props in the signature, not the body. Replace `function {{ name }}(props: T)` + `const {{ ... }} = props` with `function {{ name }}({ ... }: T)`.",
    },
  },
  defaultOptions: [],
  create(context) {
    function checkFn(
      fn:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression,
      name: string,
    ): void {
      if (!isPascal(name)) return;
      if (fn.params.length !== 1) return;
      const param = fn.params[0];
      if (!param || param.type !== "Identifier") return;
      // Require an explicit TS type — otherwise it's likely not a real component.
      if (!param.typeAnnotation) return;
      const paramName = param.name;

      if (!fn.body || fn.body.type !== "BlockStatement") return;
      const first = fn.body.body[0];
      if (!first || first.type !== "VariableDeclaration") return;
      // Look for `const { ... } = <paramName>;` as the first declarator.
      for (const decl of first.declarations) {
        if (
          decl.id.type === "ObjectPattern" &&
          decl.init &&
          decl.init.type === "Identifier" &&
          decl.init.name === paramName
        ) {
          context.report({
            node: param,
            messageId: "propsDestructureInBody",
            data: { name },
          });
          return;
        }
      }
    }

    return {
      FunctionDeclaration(node) {
        if (node.id) checkFn(node, node.id.name);
      },
      // `export default function Foo(props: P) { ... }` is also FunctionDeclaration.
      // `const Foo = (props: P) => { ... }` — VariableDeclarator init.
      VariableDeclarator(node) {
        if (
          node.id.type === "Identifier" &&
          node.init &&
          (node.init.type === "ArrowFunctionExpression" ||
            node.init.type === "FunctionExpression")
        ) {
          checkFn(node.init, node.id.name);
        }
      },
    };
  },
});
