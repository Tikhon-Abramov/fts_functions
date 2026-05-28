/**
 * Patch definitions for `scripts/patch.ts`.
 *
 * Run with:
 *   pnpm patch                                       # write changes
 *   pnpm patch -- --dry-run                          # preview only
 *   pnpm patch -- --backup                           # write a `.bak` first
 *   pnpm patch ./other.config.ts                     # custom config file
 *
 * Under the hood this calls `jiti` (already a root devDep) to execute the
 * TypeScript file directly, so no compile step is needed.
 *
 * Each entry maps a file path (resolved against the cwd you invoke from) to
 * an ordered list of patches. Patches run top-to-bottom; later patches see
 * the edits made by earlier ones in the same file.
 *
 * Tips:
 *   - Set `required: false` for patches that may already be applied — the
 *     run will proceed without throwing when nothing matches.
 *   - Set `maxReplacements: N` to fail loudly if the codegen output drifts
 *     and your pattern starts matching unexpected places.
 *   - Regex patterns auto-upgrade to global; capture groups (`$1`) work in
 *     the replacement string.
 */
import type { PatchConfig } from "./patch";

const DATA_GRID_JS =
  "/home/Kristy/Desktop/dima-asap-help-food/fts-functions/registry-functions/registry-functions/apps/web/node_modules/@mui/x-data-grid-pro/DataGridPro/DataGridPro.js";

const patches: PatchConfig = {
  [DATA_GRID_JS]: [
    {
      pattern: 'var _xDataGrid = require("@mui/x-data-grid");',
      replacement: "",
      required: true,
      maxReplacements: 1,
    },
    {
      pattern: /export function (\w+)\(/,
      replacement: "export function $1(",
      maxReplacements: 5,
    },
  ],
};

export default patches;
