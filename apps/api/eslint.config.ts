import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
  sharedIgnores,
  sharedPlugins,
  sharedPrettierConfig,
  sharedRules,
  sharedTypeCheckedRules,
} from '../../eslint.config.shared.ts';

export default tseslint.config(
  {
    ignores: [
      ...sharedIgnores,
      'eslint.config.ts',
      '**/eslint.config.ts',
      'dist/**',
      'coverage/**',
      'src/generated/**',
      'zod/**',
      // Auto-generated real-data seed: a 13k-line literal that takes
      // 5+ minutes to type-check. Treat it like other generated content.
      // Whole seed tree is excluded — it's authored by an external data
      // contributor and follows different conventions than our codebase.
      'db/seeds/**',
      '**/db/seeds/**',
      // seeds-1: stored variant of the seed tree, not applied. Same exclusion rationale as `seeds/`.
      'db/seeds-1/**',
      '**/db/seeds-1/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  sharedPrettierConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: sharedPlugins,
    rules: {
      ...sharedRules,
      ...sharedTypeCheckedRules,

      // ── NestJS-specific overrides ───────────────────────
      // NestJS heavily relies on decorators + unsafe argument patterns
      // (DTOs via Reflect metadata, guards, pipes). The unsafe-* rules
      // generate too much noise in honest NestJS code; warn-only for
      // the foreseeable future. Tightening to error is a separate effort.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',

      // Backend doesn't need i18n string detection or React-only rules.
      // Magic numbers: backend code (HTTP statuses, ms windows, retry caps)
      // is naturally numeric — relaxed.
    },
  },
  // Test files: relax noisy rules. Tests routinely pass partial / typed-as-any
  // fixtures to DTO-typed methods to exercise validation paths.
  {
    files: ['src/**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-console': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-statements': 'off',
      'max-nested-callbacks': 'off',
    },
  },
);
