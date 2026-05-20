# @registry/eslint-plugin

Project-specific ESLint rules encoding 6 of the patterns documented in
[`docs/patterns.md`](../../docs/patterns.md). Each rule corresponds to a
class number in that document.

| Rule                         | Class | Status          |
| ---------------------------- | ----- | --------------- |
| `paired-ternary-styling`     | 23    | detection       |
| `stealth-hook-helper`        | 26    | detection       |
| `props-destructure-location` | 30    | detection       |
| `sibling-jsx-data-variation` | 29    | scaffold (TODO) |
| `domain-id-registry-keys`    | 27    | scaffold (TODO) |
| `testid-registry`            | 32    | scaffold (TODO) |

The detection rules surface real candidates today; the three scaffolded
rules return empty visitors and exist so the rule list, message
catalogue, and config wiring are stable as the rules mature. The
unblock plan for each scaffold lives in
[`docs/known-limitations.md`](../../docs/known-limitations.md).

This is a TypeScript-source plugin loaded directly via jiti from
`eslint.config.shared.ts`; no build step is required for ESLint to consume
it. `pnpm --filter=@registry/eslint-plugin check` validates the types via
`tsc --noEmit`.
