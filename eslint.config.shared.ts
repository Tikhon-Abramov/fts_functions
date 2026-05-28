/**
 * Shared ESLint configuration for api + web workspaces.
 *
 * Phase 1 (W9): the common subset of agario's mature rule set
 * (`/home/Kristy/Develop/FromServer/dev/agario/frontend/eslint.config.ts`)
 * is adopted here. Per-workspace overrides (apps/api, apps/web) layer on
 * top with workspace-specific extras (NestJS unsafe-* relaxations,
 * React/JSX rules, FSD-lite layer boundaries, etc.).
 *
 * Phase 2 (later) adds Tier-2 community plugins (i18next, import, unicorn).
 * Phase 3 (later) wires in the project-specific custom plugin
 * (`@registry/eslint-plugin`) that encodes 6 of the patterns.md classes.
 *
 * Consumed by apps/api/eslint.config.ts and apps/web/eslint.config.ts via
 *   `import { sharedRules, sharedPlugins, ... } from '../../eslint.config.shared.ts'`.
 */
import type { Linter } from "eslint";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import i18next from "eslint-plugin-i18next";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unicorn from "eslint-plugin-unicorn";

import registryPlugin from "./packages/eslint-plugin-registry-functions/src/index.ts";

/**
 * Groups for simple-import-sort, mirrored from agario's ordering.
 */
export const importSortGroups: string[][] = [
  // 1. Type-only imports
  ["^.*\\u0000$"],
  // 2. React + third-party libs
  ["^react", "^@?\\w"],
  // 3. Store / app-wide
  ["^(@/app|@/store)(/.*|$)"],
  // 4. Features
  ["^(@/features)(/.*|$)"],
  // 5. Shared
  [
    "^(@/shared|@common|@src|@db|@prisma-generated|@prisma-client|@prisma-class|@registry/shared)(/.*|$)",
  ],
  // 6. Relative parents
  ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
  // 7. Relative siblings
  ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
  // 8. Styles (always last)
  ["^.+\\.s?css(\\.ts)?$"],
];

/**
 * Shared ignores: generated artefacts and config files we never lint.
 * Workspace configs may add their own.
 */
export const sharedIgnores: string[] = [
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/node_modules/**",
  "**/*.d.ts",
  // Backend codegen
  "apps/api/src/generated/**",
  "apps/api/zod/**",
  // Frontend codegen
  "apps/web/src/shared/api/ftsFunctionsApi.ts",
  // Test artefacts
  "**/test-results/**",
  "**/playwright-report/**",
];

export const sharedPlugins = {
  "simple-import-sort": simpleImportSort,
  prettier: prettierPlugin,
  // Tier 2 community plugins (Phase 2)
  i18next,
  import: importPlugin,
  unicorn,
  // Phase 3: project-specific custom plugin.
  "@registry/eslint-plugin": registryPlugin,
};

/**
 * Rules shared by every workspace (backend + frontend).
 * Per-workspace configs layer on top of these (React hooks, boundaries, etc.).
 *
 * Severity philosophy:
 *   error → blocks commits via pre-commit hook (real bugs / hard rules)
 *   warn  → surfaces but lets work proceed (style smells, taste, tightening targets)
 */
export const sharedRules: Linter.RulesRecord = {
  // ── Imports ─────────────────────────────────────────────
  "simple-import-sort/imports": ["error", { groups: importSortGroups }],
  "simple-import-sort/exports": "error",
  "@typescript-eslint/consistent-type-imports": [
    "error",
    { prefer: "type-imports", fixStyle: "inline-type-imports" },
  ],
  "@typescript-eslint/consistent-type-assertions": [
    "error",
    { assertionStyle: "as" },
  ],
  "@typescript-eslint/consistent-type-definitions": ["error", "type"], // Class 28
  "@typescript-eslint/array-type": ["error", { default: "array-simple" }],

  // ── Type safety surface (warn) ──────────────────────────
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/no-empty-function": "warn",

  // ── Errors / namespace / unused ─────────────────────────
  "@typescript-eslint/no-namespace": "error",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      // Allow `t` (i18n function arg) — i18n is being phased out, leftover
      // unused `t` params in helpers are noise during migration.
      argsIgnorePattern: "^(_|t$)",
      varsIgnorePattern: "^(_|t$)",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    },
  ],

  // ── Basic correctness ───────────────────────────────────
  "prefer-const": "error",
  eqeqeq: ["error", "always", { null: "ignore" }], // idiomatic `!= null` allowed
  "no-console": "warn",
  "prettier/prettier": "error",
  curly: ["error", "multi-line", "consistent"],
  "no-fallthrough": "error",
  "no-implicit-coercion": "error",
  "no-return-await": "error",
  "no-unreachable": "error",
  "no-else-return": ["error", { allowElseIf: false }],

  // ── Control-flow clarity ────────────────────────────────
  "no-nested-ternary": "warn", // Class 33
  "no-unneeded-ternary": "warn", // catches `x ? true : false`
  "operator-assignment": ["warn", "always"],

  // ── Size limits (warn — refactor targets, not blockers) ─
  "max-depth": ["warn", 5],
  "max-nested-callbacks": ["warn", 3],
  "max-params": ["warn", 6],
  "max-statements": ["warn", 40],
  "max-lines-per-function": [
    "warn",
    { max: 80, skipBlankLines: true, skipComments: true },
  ],
  "max-lines": ["warn", { max: 250, skipBlankLines: true, skipComments: true }],

  // ── Tier 2 — import (Phase 2) ───────────────────────────
  "import/no-cycle": ["error", { maxDepth: 5, ignoreExternal: true }],
  "import/no-self-import": "error",
  "import/no-useless-path-segments": ["warn", { noUselessIndex: false }],

  // ── Tier 2 — unicorn (small curated subset, Phase 2) ────
  // Skip the more aggressive / opinionated unicorn rules.
  "unicorn/no-array-push-push": "warn",
  "unicorn/no-array-reduce": "warn",
  "unicorn/prefer-array-flat": "warn",
  "unicorn/prefer-string-starts-ends-with": "warn",

  // ── Phase 3 — @registry/eslint-plugin (custom rules) ────
  // Detection-complete rules:
  "@registry/eslint-plugin/paired-ternary-styling": "warn", // Class 23
  "@registry/eslint-plugin/stealth-hook-helper": "warn", // Class 26
  "@registry/eslint-plugin/props-destructure-location": "warn", // Class 30
  // Stub rules — listed so the rule names are stable; visitors are empty
  // until the implementations land in W10.
  "@registry/eslint-plugin/sibling-jsx-data-variation": "warn", // Class 29
  "@registry/eslint-plugin/domain-id-registry-keys": "warn", // Class 27
  "@registry/eslint-plugin/testid-registry": "warn", // Class 32
};

/**
 * Type-checked rules. Workspaces that wire up `parserOptions.projectService`
 * and extend `tseslint.configs.recommendedTypeChecked` may layer these on.
 * Listed separately because the web workspace currently runs without project
 * info and these rules would error on non-type-checked configs.
 */
export const sharedTypeCheckedRules: Linter.RulesRecord = {
  "@typescript-eslint/restrict-template-expressions": [
    "warn",
    { allowNumber: true, allowBoolean: true, allowNullish: true },
  ],
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    { checksVoidReturn: { attributes: false } },
  ],
  "@typescript-eslint/switch-exhaustiveness-check": "warn",
  "@typescript-eslint/no-confusing-void-expression": [
    "warn",
    { ignoreArrowShorthand: true },
  ],
  "@typescript-eslint/no-unsafe-call": "warn",
  "@typescript-eslint/no-unsafe-argument": "warn",
  "@typescript-eslint/no-unsafe-return": "warn",
  "@typescript-eslint/no-unsafe-assignment": "warn",
  "@typescript-eslint/no-unsafe-member-access": "warn",
  "@typescript-eslint/use-unknown-in-catch-callback-variable": "warn",
  "@typescript-eslint/prefer-nullish-coalescing": "warn",
  "@typescript-eslint/no-unnecessary-condition": "warn",
  "@typescript-eslint/no-deprecated": "warn",
  "@typescript-eslint/restrict-plus-operands": "warn",
  "@typescript-eslint/require-await": "warn",
  "@typescript-eslint/no-redundant-type-constituents": "warn",
};

/**
 * Prettier config export — merged in last so it disables stylistic rules
 * that conflict.
 */
export const sharedPrettierConfig: Linter.Config = prettierConfig;
