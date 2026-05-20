import eslint from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
// eslint-plugin-jsx-a11y currently ships without bundled types.

// @ts-expect-error - no types
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

import {
  sharedIgnores,
  sharedPlugins,
  sharedPrettierConfig,
  sharedRules,
} from "../../eslint.config.shared.ts";

/**
 * FSD-lite layer boundaries.
 * Layer order (high → low): app → pages → components → entities → shared.
 * A layer may import from ITSELF and any LOWER layer, never from a HIGHER one.
 */
const fsdLayers = [
  { type: "app", pattern: "src/app/**" },
  { type: "pages", pattern: "src/pages/**" },
  { type: "components", pattern: "src/components/**" },
  { type: "entities", pattern: "src/entities/**" },
  { type: "shared", pattern: "src/shared/**" },
];

export default tseslint.config(
  {
    ignores: [
      ...sharedIgnores,
      "eslint.config.ts",
      "vite.config.ts",
      "playwright.config.ts",
      "tailwind.config.ts",
      "dist/**",
      "test-results/**",
      "playwright-report/**",
      "e2e/**",
      "node_modules/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  sharedPrettierConfig,
  // Register jsx-a11y plugin globally (no `files` filter) so eslint-disable
  // comments referencing `jsx-a11y/*` rules resolve regardless of whether
  // eslint runs from the workspace root (lint-staged) or from apps/web
  // (turbo/dev). The matching rule severities are configured below in the
  // src/**/*.{ts,tsx} block.
  {
    plugins: { "jsx-a11y": jsxA11y },
  },
  {
    files: ["src/**/*.{ts,tsx}", "**/src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parser: tseslint.parser,
      parserOptions: {
        // Project references (tsconfig.app.json + tsconfig.node.json) feed
        // typed lint info via projectService — preferred over an explicit
        // `project` array since TS 5.7. The non-type-checked preset is still
        // in use; layering recommendedTypeChecked is a follow-up.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      ...sharedPlugins,
      react,
      "react-hooks": reactHooks,
      boundaries,
    },
    settings: {
      react: { version: "detect" },
      "boundaries/elements": fsdLayers,
      "boundaries/ignore": ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    },
    rules: {
      ...sharedRules,

      // ── React (frontend-only, lifted from agario's frontend config) ────────
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/prop-types": "off",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      // Class 25 (JSX-returning helpers re-allocated per render).
      "react/no-unstable-nested-components": "warn",

      // ── React hooks ────────────────────────────────────
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // ── jsx-a11y (accessibility, 2026-best-in-class) ─────
      // The recommended preset; severities downgraded to `warn` initially so
      // violations surface without blocking the build. Tighten to `error`
      // selectively once the codebase reaches zero a11y warnings.
      ...Object.fromEntries(
        Object.entries(
          (jsxA11y.configs.recommended.rules ?? {}) as Record<string, unknown>,
        ).map(([rule]) => [rule, "warn"] as const),
      ),

      // ── FSD-lite layer boundaries ────────────────────────
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "app",
              allow: ["app", "pages", "components", "entities", "shared"],
            },
            {
              from: "pages",
              allow: ["pages", "components", "entities", "shared"],
            },
            { from: "components", allow: ["components", "entities", "shared"] },
            { from: "entities", allow: ["entities", "shared"] },
            { from: "shared", allow: ["shared"] },
          ],
        },
      ],

      // i18n is being phased out (single-language internal app). Russian
      // literals inline in JSX are intentional. Rule disabled.
      "i18next/no-literal-string": "off",

      // ── Handler-naming convention ────────────────────────
      // `handleX`: handler DEFINED in this component (useCallback / const)
      // `onX`:     callback prop RECEIVED from parent (in Props type)
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "variable",
          modifiers: ["const"],
          filter: { regex: "^on[A-Z]", match: true },
          format: ["camelCase"],
          custom: { regex: "^handle[A-Z]", match: true },
        },
      ],
    },
  },
  // i18n source / shared/i18n: literal strings are the data, ignore.
  {
    files: ["src/shared/i18n/**", "src/**/i18n/**"],
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  // Test/e2e files relaxed.
  {
    files: ["src/**/*.test.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "no-console": "off",
      "no-magic-numbers": "off",
      "max-lines-per-function": "off",
      "max-lines": "off",
      "max-statements": "off",
      "max-nested-callbacks": "off",
      "boundaries/element-types": "off",
      // Test fixtures often render bare interactive elements that don't need
      // full a11y wiring. Skip the noisier rules here.
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/control-has-associated-label": "off",
    },
  },
);
