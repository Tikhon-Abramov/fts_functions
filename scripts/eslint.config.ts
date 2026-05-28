import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

import {
  sharedIgnores,
  sharedPlugins,
  sharedPrettierConfig,
  sharedRules,
} from "../eslint.config.shared.ts";

export default tseslint.config(
  {
    ignores: [...sharedIgnores, "eslint.config.ts"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  sharedPrettierConfig,
  {
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "module",
    },
    plugins: sharedPlugins,
    rules: {
      ...sharedRules,
      // Scripts are CLI tools — `console.log` *is* the user interface.
      "no-console": "off",
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
      "max-statements": "off",
      "max-nested-callbacks": "off",
    },
  },
);
