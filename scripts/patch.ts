/**
 * String/regex patcher for buggy auto-generated code from third-party libs.
 *
 * Each entry in `PatchConfig` maps an absolute (or cwd-relative) file path
 * to a list of patches applied in order. Use `required: false` for patches
 * that may already be applied (idempotent re-runs), and `maxReplacements`
 * to fail loudly if a pattern matches more places than expected — that's
 * usually a sign the upstream codegen output drifted and your patch needs
 * to be re-targeted.
 */

import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TAB = "    ";
const SYMBOLS = {
  file: "▸",
  applied: "✓",
  skipped: "·",
  wrote: "✔",
  dryRun: "⏵",
} as const;

export type Patch = {
  pattern: RegExp | string;
  replacement: string;
  required?: boolean;
  maxReplacements?: number;
};

export type PatchConfig = Record<string, readonly Patch[]>;

export type PatchResult = {
  filePath: string;
  changed: boolean;
  replacements: number;
};

export type PatchOptions = {
  dryRun?: boolean;
  backup?: boolean;
  silent?: boolean;
};

export async function applyPatches(
  patches: PatchConfig,
  options: PatchOptions = {},
): Promise<PatchResult[]> {
  const { dryRun = false, backup = false, silent = false } = options;
  const log = silent ? () => {} : (line: string) => console.log(line);

  const results: PatchResult[] = [];

  for (const [filePath, filePatches] of Object.entries(patches)) {
    log(`${SYMBOLS.file} ${filePath}`);
    const original = await fs.readFile(filePath, "utf8");

    let current = original;
    let totalReplacements = 0;

    for (const patch of filePatches) {
      const { next, replacements } = applyPatch(current, patch);

      if ((patch.required ?? true) && !replacements) {
        throw new Error(
          `Patch failed: pattern not found in ${filePath}: ${describePattern(patch.pattern)}`,
        );
      }

      if (
        patch.maxReplacements !== undefined &&
        replacements > patch.maxReplacements
      ) {
        throw new Error(
          `Patch unsafe: ${filePath} matched ${replacements} times, max allowed ${patch.maxReplacements} for ${describePattern(patch.pattern)}`,
        );
      }

      log(
        replacements > 0
          ? `${TAB}${SYMBOLS.applied} ${replacements}× ${describePattern(patch.pattern)}`
          : `${TAB}${SYMBOLS.skipped} 0× ${describePattern(patch.pattern)} (optional)`,
      );

      current = next;
      totalReplacements += replacements;
    }

    const changed = current !== original;
    results.push({ filePath, changed, replacements: totalReplacements });

    if (!changed) {
      log(`${TAB}${SYMBOLS.skipped} no changes`);
      continue;
    }

    if (dryRun) {
      log(
        `${TAB}${SYMBOLS.dryRun} dry-run: ${totalReplacements} change(s) not written`,
      );
      continue;
    }

    if (backup) {
      await fs.writeFile(`${filePath}.bak`, original);
      log(`${TAB}${SYMBOLS.skipped} backup → ${filePath}.bak`);
    }

    await fs.writeFile(filePath, current);
    log(`${TAB}${SYMBOLS.wrote} wrote ${totalReplacements} change(s)`);
  }

  return results;
}

function applyPatch(
  content: string,
  patch: Patch,
): { next: string; replacements: number } {
  if (patch.pattern instanceof RegExp) {
    return replaceRegex(content, patch.pattern, patch.replacement);
  }
  if (!patch.pattern.length) {
    throw new Error("String pattern must not be empty");
  }
  return replaceLiteral(content, patch.pattern, patch.replacement);
}

function replaceRegex(
  content: string,
  pattern: RegExp,
  replacement: string,
): { next: string; replacements: number } {
  // Without the `g` flag, `String.prototype.replace` swaps only the first hit
  // (`'aaa'.replace(/a/, 'b')` → `'baa'`). We want a whole-file rewrite, so we
  // clone the pattern with `g` added when the caller didn't supply it.
  const globalPattern = pattern.global
    ? pattern
    : new RegExp(pattern.source, `${pattern.flags}g`);

  const replacements = content.match(globalPattern)?.length ?? 0;
  const next = content.replace(globalPattern, replacement);

  return { next, replacements };
}

function replaceLiteral(
  content: string,
  needle: string,
  replacement: string,
): { next: string; replacements: number } {
  let replacements = 0;
  for (const _ of indicesOf(content, needle)) replacements++;

  return { next: content.split(needle).join(replacement), replacements };
}

function* indicesOf(haystack: string, needle: string): Generator<number> {
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    yield index;
    index = haystack.indexOf(needle, index + needle.length);
  }
}

function describePattern(pattern: RegExp | string): string {
  return pattern instanceof RegExp
    ? pattern.toString()
    : JSON.stringify(pattern);
}

// ── CLI entry point ───────────────────────────────────────────────
// Run as: `pnpm patch [config-path] [--dry-run] [--backup] [--silent]`
// (which invokes jiti). The config file must default-export a `PatchConfig`.
// See patches.config.ts for the starter template.

const DEFAULT_CONFIG_PATH = "scripts/patches.config.ts";

type CliArgs = {
  configPath: string;
  options: PatchOptions;
};

function parseCliArgs(argv: readonly string[]): CliArgs {
  const flags = new Set(argv.filter((arg) => arg.startsWith("--")));
  const positional = argv.filter((arg) => !arg.startsWith("--"));

  return {
    configPath: positional[0] ?? DEFAULT_CONFIG_PATH,
    options: {
      dryRun: flags.has("--dry-run"),
      backup: flags.has("--backup"),
      silent: flags.has("--silent"),
    },
  };
}

async function loadConfig(configPath: string): Promise<PatchConfig> {
  const absolute = resolve(process.cwd(), configPath);
  const module = (await import(pathToFileURL(absolute).href)) as {
    default?: PatchConfig;
  };

  if (!module.default) {
    throw new Error(
      `Config at ${configPath} must default-export a PatchConfig`,
    );
  }
  return module.default;
}

async function runCli(argv: readonly string[]): Promise<void> {
  const { configPath, options } = parseCliArgs(argv);
  const patches = await loadConfig(configPath);
  const results = await applyPatches(patches, options);

  const totalChanged = results.filter((r) => r.changed).length;
  const totalReplacements = results.reduce((sum, r) => sum + r.replacements, 0);

  if (!options.silent) {
    console.log(
      `\n${SYMBOLS.wrote} done — ${totalChanged}/${results.length} file(s) changed, ${totalReplacements} replacement(s)`,
    );
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  runCli(process.argv.slice(2)).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${message}`);
    process.exit(1);
  });
}
