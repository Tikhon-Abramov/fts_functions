/**
 * @registry/eslint-plugin
 *
 * Project-specific ESLint rules encoding 6 of the patterns.md classes.
 * See README.md for the rule-to-class table and current status.
 */
import { domainIdRegistryKeys } from "./rules/domain-id-registry-keys.ts";
import { pairedTernaryStyling } from "./rules/paired-ternary-styling.ts";
import { propsDestructureLocation } from "./rules/props-destructure-location.ts";
import { siblingJsxDataVariation } from "./rules/sibling-jsx-data-variation.ts";
import { stealthHookHelper } from "./rules/stealth-hook-helper.ts";
import { testidRegistry } from "./rules/testid-registry.ts";

const plugin = {
  meta: {
    name: "@registry/eslint-plugin",
    version: "0.1.0",
  },
  rules: {
    "paired-ternary-styling": pairedTernaryStyling,
    "stealth-hook-helper": stealthHookHelper,
    "props-destructure-location": propsDestructureLocation,
    "sibling-jsx-data-variation": siblingJsxDataVariation,
    "domain-id-registry-keys": domainIdRegistryKeys,
    "testid-registry": testidRegistry,
  },
} as const;

export default plugin;
