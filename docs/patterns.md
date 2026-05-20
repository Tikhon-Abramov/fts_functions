# Code Patterns — Registry-Functions

The living library of patterns we apply and anti-patterns we refuse. Every class of issue the team has found has a home here: what it is, how to find it, how to fix it, how to prevent its return.

Read this before writing a new component. Read it before reviewing a PR. When you find a pattern that should be here, add it.

> **Numbering note**: classes are numbered 1-17 and 23-33. Numbers 18-22 are intentionally unallocated — kept available for additions in the lower-mid range as the library grows. Don't read significance into the gap.

---

## How this document is structured

Each class follows the same shape:

- **Shape** — what the issue looks like in code.
- **Why it's wrong** — what it costs (readability, safety, performance, future maintenance).
- **How to find it** — grep pattern, ESLint rule, or review lens.
- **How to fix it** — the refactored form, with a before/after.
- **How to prevent recurrence** — the lint rule, convention, or review checklist that stops it from returning.

---

## Class 1 — Hardcoded Russian UI strings

**Shape**: user-facing text as string literals inside components.

```tsx
<Button>Сохранить</Button>
<Typography>Нажмите, чтобы добавить функцию</Typography>
```

**Why wrong**: no translation path, no central vocabulary, operators editing copy must grep for strings in source code.

**How to find**:

```bash
grep -rEn '[А-ЯЁа-яё]' frontend/src --include='*.ts' --include='*.tsx'
```

**How to fix**: move to `frontend/src/shared/i18n/ru/<domain>.json`, reference via typed key.

```tsx
import { useTranslation } from 'react-i18next';
import { I18N } from '@/shared/i18n/keys';

const { t } = useTranslation('form');
// ...
<Button>{t(I18N.form.save)}</Button>
<Typography>{t(I18N.registry.addFunctionHint)}</Typography>
```

**Prevention**: ESLint `no-restricted-syntax` rule forbidding Cyrillic string literals outside `shared/i18n/**`.

---

## Class 2 — String unions instead of const-as-const enums

**Shape**: inline string-union types representing an enumerable concept — **including** prop-level UI variant unions, not just business-domain enums.

```ts
// Business-domain (obvious cases):
type Severity = "error" | "success" | "info" | "warning";
type ThemeMode = "light" | "dark";

// UI variant props (also Class 2 — easy to miss):
type CountChipProps = { emphasis?: "subtle" | "accent" };
type ButtonProps = { tone?: "neutral" | "primary" | "danger" };
type CellProps = { align?: "left" | "right" | "center" };
```

**Why wrong**: no runtime value to reference, no iteration, no single source of truth, typos silently compile, no symbol identity for IDE rename / variant-split refactors. The UI-variant case is the same smell as the business-domain case — same fix, same payoff.

**The single test**: if a string is one of a finite set of named choices that callers pick from, it's an enum-object. If it's free-form text or arbitrary, it's a string. `"subtle" | "accent"` fails the free-form test → enum-object.

**How to find**:

```bash
# All inline string unions (business-domain + UI variants alike):
grep -rEn '"[a-z][a-zA-Z0-9_-]*"\s*\|\s*"' frontend/src backend/src --include='*.ts' --include='*.tsx'
# Type aliases of literal unions:
grep -rEn 'type \w+ = "[^"]+" \|' frontend/src backend/src
# Prop types declared with literal unions:
grep -rEn ':\s*"[a-z][^"]*"\s*\|\s*"' frontend/src --include='*.tsx'
```

**How to fix**: const-as-const object + derived type. Pick a canonical home — `entities/<feature>/model/` for domain enums, `shared/ui/<component>/` (co-located with the component) for UI-variant enums.

```ts
// shared/ui/CountChip/CountChip.tsx (or a co-located model file)
export const EMPHASIS = {
  SUBTLE: "subtle",
  ACCENT: "accent",
} as const;
export type Emphasis = typeof EMPHASIS[keyof typeof EMPHASIS];

export type CountChipProps = {
  label: string;
  emphasis?: Emphasis;
};

// Call site:
<CountChip label="3" emphasis={EMPHASIS.ACCENT} />

// Variant-discriminated styling collapses to a Record (ties into Class 23 / 27):
const STYLE_BY_EMPHASIS: Record<Emphasis, ChipStyle> = {
  [EMPHASIS.SUBTLE]: { bg: c.chipSubtle, fg: c.textSecondary, border: c.borderMedium },
  [EMPHASIS.ACCENT]: { bg: c.linkCountChipBg, fg: c.accentBlue, border: c.accentBlue },
};
```

**Prevention**: convention "no string-literal unions for prop variants — every named choice is a registry." ESLint rule (future) flagging `type X = "..." | "..."` outside `shared/i18n` and `*.d.ts` files.

---

## Class 3 — Repetitive inline `sx` blocks

**Shape**: large `sx` literal copied into multiple components.

```tsx
<TextField sx={{
  '& .MuiOutlinedInput-root': { bgcolor: c.bgInput, color: c.textBody, ... },
  '& .MuiInputLabel-root': { color: c.textMuted, ... },
  // ...40 more lines
}} />
```

**Why wrong**: theme knowledge leaks everywhere, changing one visual means grepping for every copy, components read as style noise.

**How to find**: review diff; grep for `sx: {` or `sx=\{\{` with 5+ lines.

**How to fix**: extract to `frontend/src/shared/ui/styles/*.ts`:

```ts
// shared/ui/styles/form.ts
import type { SxProps, Theme } from "@mui/material";

export const formInputSx = (theme: Theme): SxProps<Theme> => ({
  "& .MuiOutlinedInput-root": {
    /* ... */
  },
  "& .MuiInputLabel-root": {
    /* ... */
  },
});
```

```tsx
<TextField sx={formInputSx(theme)} />
```

Plus theme-level component defaults (`theme.components.MuiTextField.defaultProps`) for app-wide patterns.

**Prevention**: code review — any `sx` over 5 lines that appears twice must be extracted.

---

## Class 4 — Manual form validation / dirty checks

**Shape**: hand-rolled `isFormValid`, manual dirty tracking, ad-hoc `.trim() !== ''` chains.

```ts
function isFormValid(form: FormFields): boolean {
  return (
    form.a.trim() !== '' &&
    form.b.trim() !== '' &&
    form.c.trim() !== '' &&
    // ...8 more
  );
}
```

**Why wrong**: no typed error messages, no field-level state, no schema as single source of truth, adding a field means editing multiple places.

**How to find**: grep for `isFormValid`, `manual .trim() !== ''`, or any component using multiple `useState` for individual form fields.

**How to fix**: `react-hook-form` + `zod` resolver.

```ts
const schema = z.object({
  a: z.string().min(1),
  b: z.string().min(1),
  // ...
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  mode: "onChange",
});
// form.formState.isValid, form.formState.isDirty, form.formState.errors — all typed
```

**Prevention**: convention — all forms go through RHF; no manual `useState` per field for forms with 3+ fields.

---

## Class 5 — Missing `useEffect` / `useCallback` / `useMemo` dependency arrays

**Shape**: hook called without deps array, or with stale/incomplete deps.

```tsx
useEffect(() => {
  doSomething(value);
}); // no deps — fires every render
useEffect(() => {
  doSomething(value);
}, []); // stale closure over `value`
```

**Why wrong**: React correctness bug. Effects fire too often or too rarely. Behavior depends on render cadence, which is invisible.

**How to find**: ESLint `react-hooks/exhaustive-deps` catches all cases.

**How to fix**: add the missing deps. If fixing creates an infinite loop, the effect is doing the wrong thing — refactor.

**Prevention**: `react-hooks/exhaustive-deps` rule as WARN (already configured).

---

## Class 6 — Huge multi-responsibility components

**Shape**: component file >300 LOC, or does multiple clearly separable jobs.

**Why wrong**: nobody reads 700-line component files usefully. Refactoring becomes risky. Testing individual concerns impossible.

**How to find**:

```bash
wc -l frontend/src/**/*.tsx | sort -rn | head
```

Files over 300 LOC are candidates.

**How to fix**: extract helper components (agario's rule: any `.map()` with 5+ lines of JSX → helper). Extract custom hooks for state clusters. See `agario/docs/guides/standards.md` for the rules.

**Prevention**: ESLint `max-lines` rule (if enabled, set at 400 with a warn level).

---

## Class 7 — Magic numbers

**Shape**: numeric literals in code for values that are tunable settings.

```tsx
useDebouncedValue(value, 400)
autoHideDuration={6000}
pollingInterval: 30_000
```

**Why wrong**: tuning a value means grepping the app. Different components drift out of sync.

**How to find**: grep for inline numeric literals in setTimeout, setInterval, debounce calls, polling options.

**How to fix**: `frontend/src/shared/config/*.ts` — named exports.

```ts
import { DEBOUNCE_MS, POLL_INTERVALS } from "@/shared/config";
useDebouncedValue(value, DEBOUNCE_MS.SEARCH);
```

**Prevention**: convention — any numeric literal representing milliseconds, pixels (other than component-local layout), or size limits must come from `shared/config`.

---

## Class 8 — Unused dependencies

**Shape**: npm packages in `package.json` that no file imports.

**Why wrong**: bundle bloat, vulnerability surface, confusion for new devs ("do we use tailwind?" — no, but it's installed).

**How to find**: `npx depcheck` (add as devDep if not present).

**How to fix**: remove them. If CI fails, add it back with a comment explaining why.

**Prevention**: quarterly `depcheck` audit or CI job.

---

## Class 9 — Dictionary FKs as hardcoded display strings

**Shape**: component uses the Russian display name of a dictionary value as the fallback.

```ts
periodicity: row.periodicity || "Разово";
complexity: row.complexity || "Средняя";
```

**Why wrong**: if admin renames the Type row, code silently breaks. Couples UI to specific vocabulary. Not translation-safe.

**How to find**:

```bash
grep -rEn '\|\| "[А-ЯЁа-яё]"' frontend/src
```

**How to fix**: look up from the actual dictionary data.

```ts
const { byCategory } = useDictionary(types);
const defaultPeriodicity =
  byCategory[Category.FTS_FUNCTION_EXECUTION_FREQUENCY][0]?.id;
periodicity: row.periodicity ?? defaultPeriodicity;
```

**Prevention**: convention — any UI default that represents a dictionary value must resolve via the dictionary hook.

---

## Class 10 — Overused `--no-verify`

**Shape**: developers bypass pre-commit hooks routinely instead of fixing their cause.

**Why wrong**: hooks exist to prevent broken commits. Bypassing them accumulates drift.

**How to find**: grep commit history (`git log --all --grep='no-verify'`). Local: review PRs.

**How to fix**: relax the hook's strictness (current `.lintstagedrc.json` already relaxed from `--max-warnings=0` to `--fix` only). Keep errors blocking, let warnings through.

**Prevention**: `.lintstagedrc.json` configured correctly; `--no-verify` reserved for genuine emergencies.

---

## Class 11 — Parameterless utility proliferation

**Shape**: multiple near-identical functions differing only in a preset.

```ts
// smell
formatShortDate(d); // '24.04.2026'
formatLongDate(d); // '24 апреля 2026 г.'
formatDateTime(d); // '24.04.2026 15:30'
formatRelativeDate(d); // 'сегодня'
```

**Why wrong**: proliferation means "which one do I use?" — especially when names are ambiguous. Adding a new preset means a new function. Tests duplicate.

**How to find**: grep for shared prefixes in function names.

```bash
grep -rEn '^export function (format|parse|to|from|get)' frontend/src backend/src | cut -d: -f3 | sort
```

**How to fix**: one parameterized function with options.

```ts
formatDate(d, { style: "short" });
formatDate(d, { style: "long" });
formatDate(d, { style: "relative" });
formatDate(d, { style: "short", includeTime: true });
```

**Prevention**: code review question — "if three similar functions exist, would one with params work?"

---

## Class 12 — Direct env access outside centralized config

**Shape**: `import.meta.env[...]` or `process.env[...]` read inline in components.

```ts
baseUrl: import.meta.env["VITE_API_BASE_URL"];
```

**Why wrong**: scattered env reads = scattered truth. Typing and validation are absent. Missing env throws deep inside code instead of at boot.

**How to find**:

```bash
grep -rn 'import\.meta\.env\|process\.env' frontend/src backend/src | grep -v shared/config/env
```

**How to fix**: centralize in `frontend/src/shared/config/env.ts` (frontend) or `backend/src/common/config/env.ts` (backend). Validate at boot, export typed constants.

```ts
// frontend/src/shared/config/env.ts
const assertEnv = (k: keyof ImportMetaEnv): string => {
  const v = import.meta.env[k];
  if (!v) throw new Error(`Missing required env: ${k}`);
  return v;
};

export const ENV = {
  API_BASE_URL: assertEnv("VITE_API_BASE_URL"),
  MODE: import.meta.env.MODE,
} as const;
```

Plus type declaration in `frontend/src/vite-env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly MODE: "development" | "production";
}
```

**Prevention**: ESLint rule `no-restricted-syntax` forbidding `import.meta.env` outside the env config file.

---

## Class 13 — Nested ternary expressions

**Shape**: `cond1 ? a : cond2 ? b : c`.

**Why wrong**: reader has to balance nested conditions visually. No stack trace on branches. Typically signals missing abstraction.

**How to find**: ESLint `no-nested-ternary` (already enabled).

**How to fix**: extract to a named function with `if/else`. Named functions show in stack traces.

```ts
function stringifyPart(m: unknown): string {
  if (typeof m === "string") return m;
  if (m && typeof m === "object" && "message" in m) {
    return String((m as { message?: unknown }).message ?? "");
  }
  return JSON.stringify(m);
}

items.map(stringifyPart);
```

**Prevention**: ESLint `no-nested-ternary` + `no-unneeded-ternary` (`x ? true : false`).

---

## Class 14 — Hardcoded enum literals when shared mirror exists

**Shape**: raw `"FTS_COMPETENCY_CENTER"` string when `@registry/shared/enums` exports `Category.FTS_COMPETENCY_CENTER`.

**Why wrong**: typos compile. Jump-to-def goes nowhere. "Find references" misses call sites.

**How to find**:

```bash
grep -rEn '"FTS_[A-Z_]+"' frontend/src
```

**How to fix**: import from shared.

```ts
import { Category } from "@registry/shared/enums";

t.category === Category.FTS_COMPETENCY_CENTER;
```

**Prevention**: ESLint `no-restricted-syntax` rule forbidding `"FTS_[A-Z_]+"` literals outside `packages/shared/` or i18n JSON.

---

## Class 15 — Repeated filter+map for same dictionary

**Shape**: multiple `useMemo` blocks that each filter the same source by a different category.

```ts
const centralizationOptions = useMemo(
  () => types.filter((t) => t.category === X).map(toOption),
  [types],
);
const markerOptions = useMemo(
  () => types.filter((t) => t.category === Y).map(toOption),
  [types],
);
const competencyCenterOptions = useMemo(
  () => types.filter((t) => t.category === Z).map(toOption),
  [types],
);
// ...
```

**Why wrong**: O(n × k) total work, duplication, useMemo sprawl.

**How to fix**: one hook returning a bundle.

```ts
export function useDictionary(types: TypeResponseDto[]): Dictionary {
  return useMemo(() => {
    const byCategory = {} as Record<Category, TypeResponseDto[]>;
    const optionsByCategory = {} as Record<Category, SelectOption[]>;
    const byId = new Map<number, TypeResponseDto>();
    const byCode = new Map<string, TypeResponseDto>();

    for (const cat of Object.values(Category)) {
      byCategory[cat] = [];
      optionsByCategory[cat] = [];
    }
    for (const t of types) {
      byCategory[t.category].push(t);
      optionsByCategory[t.category].push({ value: t.id, label: t.name });
      byId.set(t.id, t);
      byCode.set(t.code, t);
    }
    return { byCategory, optionsByCategory, byId, byCode };
  }, [types]);
}
```

Consumer:

```ts
const { optionsByCategory } = useDictionary(types);
<DataGrid columns={[{ valueOptions: optionsByCategory[Category.FTS_COMPETENCY_CENTER] }, ...]} />
```

**Prevention**: code review — any time two `useMemo` blocks derive from the same source, ask "should this be one hook?"

---

## Class 16 — Repeated options objects for query/hook calls

**Shape**: the same options literal passed to multiple `useQuery` / `useMutation` / etc. calls.

```ts
useX(
  {},
  {
    pollingInterval: 30_000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  },
);
useY(
  {},
  {
    pollingInterval: 30_000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  },
);
```

**Why wrong**: options object IS a named thing. Naming it makes the call site self-documenting.

**How to fix**: named base-options constants.

```ts
// shared/api/query-options.ts
export const DICTIONARY_QUERY_OPTIONS = {
  pollingInterval: POLL_INTERVALS.DICTIONARY_MS,
  skipPollingIfUnfocused: POLL_SKIP_WHEN_UNFOCUSED,
  refetchOnFocus: true,
} as const;

// call site
useX({}, DICTIONARY_QUERY_OPTIONS);
useY({}, DICTIONARY_QUERY_OPTIONS);
```

**Prevention**: convention — any options object used in 2+ places becomes a named constant.

---

---

## Class 17 — Inline business logic in components

**Shape**: pure translation/computation/mapping logic embedded in a `useMemo` body or event handler, rather than extracted to a named function in a utility file.

```tsx
const baseArgs = useMemo(() => {
  const args: Record<string, unknown> = {};
  for (const item of filterModel.items) {
    if (item.field === "id") {
      switch (item.operator) {
        case "=": {
          /* 10 lines of coercion */ break;
        }
        case "!=": {
          /* ... */ break;
        }
        // ... many more
      }
    }
  }
  return args;
}, [filterModel]);
```

**Why wrong**: pure logic should be unit-testable standalone and named for its purpose. Embedding it in components mixes business logic with rendering, making both harder to understand. Reuse becomes copy-paste.

**How to find**: `useMemo` or `useCallback` with >10 lines of body. Inline `for` loops, `switch` statements, or multi-branch conditionals inside hook bodies.

**How to fix**: extract to a named pure function in the matching domain's API or utility module.

```ts
// frontend/src/entities/fts-function/api/filter-translators.ts
export function translateFilterModel(
  model: GridFilterModel,
): Partial<ListArgs> {
  // ... the logic, now unit-testable
}

// component reads linearly
const baseArgs = useMemo(
  () => ({
    ...translateFilterModel(filterModel),
    ...translateSortModel(sortModel),
  }),
  [filterModel, sortModel],
);
```

**Prevention**: review lens — "if the hook body has a verb-phrase name you'd give it (`translateFilterModel`, `buildOptions`, `collectErrors`), that phrase IS the function to extract."

---

## Class 23 — Boolean-discriminated styling inline instead of variant lookup

**Shape**: a button (or chip, or any component) with two visual states (`active`/`inactive`, `selected`/`unselected`), where the styling for each state is inlined as a ternary spread inside `sx`. When a sibling button does the same thing for the other state, ~30 LOC of styling is duplicated.

```tsx
<Button sx={{ ...(isActive ? activeSx : inactiveSx) }}>...</Button>
<Button sx={{ ...(isActive ? activeSx : inactiveSx) }}>...</Button>
```

**Why wrong**: each call site re-states the `active` and `inactive` styles. Adding a third state means editing every call site. Reading the JSX requires decoding the ternary every time.

**How to find**: grep for `sx={{ ... ?` (sx with ternary spread). Patterns with paired siblings differing only in a discriminator value are the strongest candidates.

**How to fix**: extract a helper component that takes the discriminator as a prop and resolves the variant internally.

```tsx
function StepToggleButton({
  step,
  currentStep,
  onSelect,
  labelKey,
  t,
  testId,
}: Props) {
  const isActive = step === currentStep;
  return (
    <Button
      variant={isActive ? "contained" : "outlined"}
      sx={isActive ? activeStepButtonSx : inactiveStepButtonSx}
      onClick={() => onSelect(step)}
      data-testid={testId}
    >
      {t(labelKey)}
    </Button>
  );
}
```

Two lines per caller. Variant logic in one place.

**Prevention**: review lens — "does this `sx` ternary appear in a sibling element with the OTHER branch active? Then it's a helper component."

---

## Class 24 — If/else chain on enum-like discriminator instead of dispatch table

**Shape**: a function (or JSX block) that branches `if (x === 'a') return ... else if (x === 'b') return ...` over an enum-like value, where each branch is a small expression that could be a lookup.

```typescript
if (key === "periodicity") return t(PERIODICITY_I18N[raw]);
if (key === "complexity") return t(COMPLEXITY_I18N[raw]);
return String(raw);
```

**Why wrong**: adding a new case requires editing the function. The enum-key-to-handler mapping is implicit in code rather than declared as data. Hard to test individual handlers.

**How to find**: grep for sequences of `if (X === 'literal')` returning small expressions. Same shape applies to ternary chains: `cond1 ? v1 : cond2 ? v2 : v3`.

**How to fix**: dispatch table — `Record<EnumValue, Handler>`. Adding a case is a one-row addition.

```typescript
const FIELD_RESOLVERS: Partial<
  Record<keyof Row, (v: unknown, t: TFunction) => string>
> = {
  periodicity: (v, t) =>
    t(PERIODICITY_I18N[v as FtsFunctionExecutionFrequency]),
  complexity: (v, t) => t(COMPLEXITY_I18N[v as FtsFunctionComplexity]),
};

const resolveExtraFieldValue = (key: keyof Row): string | undefined => {
  const raw = row[key];
  if (raw == null || raw === "") return undefined;
  return FIELD_RESOLVERS[key]?.(raw, t) ?? String(raw);
};
```

The "what if more cases" test from class #15 applies: if adding a new case requires touching N places, you have a class #24 in disguise. Lift to a registry.

**Prevention**: code review — "if I added a 4th step / 6th category / 10th status, what would I edit? If the answer is 'this function', it's class #24."

---

## Class 25 — Pure helpers recreated per render that should be module-level

**Shape**: a helper function defined inside a component body via `const foo = () => {...}` or `function foo() {...}`, where the helper doesn't close over component state.

```tsx
export default function Component() {
  // re-allocated per render — no need to be inside
  const formatLabel = (x: string) => x.toUpperCase();
  const renderField = (k: string, v: string) => (
    <Typography>
      {k}: {v}
    </Typography>
  );
  // ...
}
```

**Why wrong**: per-render re-allocation. Pass to memo'd children → breaks memoization. Subtle perf cost in dense lists or large component trees.

**How to find**: ESLint `react/no-unstable-nested-components` catches the JSX-returning case. For non-JSX helpers, code review: "does this function reference any state, ref, or prop? If no, why is it inside?"

**How to fix**: hoist to module scope (above or below the component, depending on usage). For helpers needing one or two pieces of component state, prefer `useCallback` if passed to memo'd children, or just leave inline if not.

```tsx
// module-level
function formatLabel(x: string): string {
  return x.toUpperCase();
}
function renderField(k: string, v: string): ReactElement {
  return (
    <Typography>
      {k}: {v}
    </Typography>
  );
}

export default function Component() {
  // ...
}
```

**Prevention**: ESLint rule `react/no-unstable-nested-components` for the JSX case. Convention for the rest: pure helpers go module-level; stateful helpers go inline (with `useCallback` if passed to memo'd children).

---

## Class 26 — Stealth-hook helper (helper that secretly calls a hook)

**Shape**: a function shaped like a helper (small, named like presentation, called from one branch of one parent) that opens with `useTheme()` / `useTranslation()` / `useState()` inside its body. The parent already has the same hook output one or two lines above the call site.

```tsx
export default function RowDetailsPanel({ row }: Props) {
  const theme = useTheme();
  const c = theme.custom;
  // ...
  if (!row) return <EmptyState t={t} />; // parent already has `c`
  // ...
}

function EmptyState({ t }: { t: TFunction }) {
  const theme = useTheme(); // stealth hook
  const c = theme.custom;
  return <Box sx={{ color: c.textDim }}>...</Box>;
}
```

**Why wrong**: the function is called once from one place where the dependency is already in scope. Re-reading it via a hook adds a context subscription, an extra render slot, and an extra pretense — the function pretends to be self-contained but is actually coupled to the same context as the parent. A function with hooks IS a sub-component; a function without hooks IS a helper. Don't pick a name from column A and behaviour from column B.

**How to find**:

1. `grep -nE "^function [A-Z][A-Za-z0-9]*\(" src/**/*.tsx` for in-file PascalCase functions, then check whether each one calls `use*` inside.
2. Heuristic: if a function is co-located with its only caller AND opens with a hook AND the caller calls the same hook → smell.
3. ESLint custom rule (future): "function declared in same file as its sole caller cannot call a context hook".

**How to fix** — pick one of two doors:

- **(A) Pass the dependency as a prop** when the thing is a tiny presentational stub used in one place. This is what makes it honestly a helper. _(EmptyState case — a 20-line empty branch.)_

  ```tsx
  if (!row) return <EmptyState t={t} c={c} />;
  function EmptyState({ t, c }: { t: TFunction; c: CustomPalette }) {
    return <Box sx={{ color: c.textDim }}>...</Box>;
  }
  ```

  Even cleaner: just inline the JSX in the parent and skip the helper entirely. If it's used once and is small, the named function buys nothing.

- **(B) Promote to a real sub-component** when it has its own state, effects, branching, or is reused across files. Move it to its own file (`src/components/empty-state/EmptyState.tsx`), give it a typed `Props`, export it, and let it own its hooks honestly.

**Prevention**: convention: "helpers don't hook." When you reach for `useTheme()` inside a function declared in the same file as its sole caller, that's the moment to ask "should this be inlined, take a prop, or move out?" — pick door (A) or (B) before writing the hook line.

**Anti-anti-pattern**: don't lift hooks out of _real_ sub-components. A component that lives in its own file, has a `Props` type, and is used from multiple places is a sub-component, not a helper — `useTheme()` inside such a component is correct (e.g. `RowDetailsView`, `LinkRow`, `FieldLabel`).

**The one-stance-per-layer rule** (extends Classes 21 + 26):

| Layer                                                                       | `t` (translation)         | `theme` / `c` (palette) | `useState`, `useEffect`, etc.                   |
| --------------------------------------------------------------------------- | ------------------------- | ----------------------- | ----------------------------------------------- |
| **Helper** (same file as parent, used once, no own state, ≤2 props ideally) | prop                      | prop                    | forbidden — if it needs them, it's not a helper |
| **Real sub-component** (own file, exported, may have state/effects)         | hook (`useTranslation()`) | hook (`useTheme()`)     | hook (own state allowed)                        |

The smell is _mixing_ within one layer — passing `t` as prop to a component that _also_ calls `useTheme()` inside. Pick one stance per layer:

```tsx
// Smell — real sub-component receives `t` as prop AND uses useTheme():
export function DetailRightPanelTabs({ value, tabs, onChange, t }: Props) {
  const theme = useTheme(); // ← hook used freely
  const c = theme.custom;
  // ...
  <Tab>{t(tab.labelKey)}</Tab>; // ← but t threaded as prop
}

// Right — real sub-component uses both as hooks:
export function DetailRightPanelTabs({ value, tabs, onChange }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;
  // ...
}

// Right — helper takes both as props:
function EmptyState({ t, c }: { t: TFunction; c: CustomPalette }) {
  return <Box sx={{ color: c.textDim }}>{t(I18N.empty)}</Box>;
}
```

**Why this works as a clean rule**: helpers are the _pure_ layer (testable in isolation, no React-context dependency, single-use, often inside `.map()` callbacks). Real components are the _integrated_ layer (own their context dependencies via React's idiomatic hooks). Mixing gets you the worst of both: noisier signature _and_ hidden dependency.

**Sweep heuristic**: any component file with `({ ..., t }: Props)` in its signature AND `useTheme()` in its body is a Class 26 mixed-stance instance. Drop the `t` prop, replace with `useTranslation()` inside.

---

## Class 27 — Literal property keys for domain-meaningful identifiers

**Shape**: an object literal keyed by string literals that name a domain concept (a `Row` field, a step name, an action code, a category). The keys are typed (often via `Partial<Record<keyof T, ...>>`), so this is type-safe — but the literal strings live in isolation, disconnected from the central registry every other reference uses.

```ts
// Smell — type-safe but not consistent with the rest of the codebase.
const FIELD_RESOLVERS: Partial<
  Record<keyof Row, (v: unknown, t: TFunction) => string>
> = {
  periodicity: (v, t) =>
    t(PERIODICITY_I18N[v as FtsFunctionExecutionFrequency]),
  complexity: (v, t) => t(COMPLEXITY_I18N[v as FtsFunctionComplexity]),
};
```

The right shape uses computed keys from the registry:

```ts
// Right — same type safety, plus uniform with every other domain-id reference.
const FIELD_RESOLVERS: Partial<
  Record<keyof Row, (v: unknown, t: TFunction) => string>
> = {
  [ROW_FIELD.PERIODICITY]: (v, t) =>
    t(PERIODICITY_I18N[v as FtsFunctionExecutionFrequency]),
  [ROW_FIELD.COMPLEXITY]: (v, t) =>
    t(COMPLEXITY_I18N[v as FtsFunctionComplexity]),
};
```

**Why this matters here**: type safety is _identical_ between the two forms — `satisfies` / `Record<keyof T, ...>` enforces the literal type either way. The argument is **uniformity, not soundness**. This codebase routes every domain-meaningful identifier through a single const-as-const registry (`FTS_FUNCTION_STEP`, `CATEGORY`, `RIGHT_TAB`, etc.). Mixing in literal-string keys _for the same identifiers_ creates two reference styles for the same concept — bad for grep, bad for rename, bad for "absolutely no smell" coherence.

**The rule** _(in this codebase)_: any domain-meaningful identifier — including ones that are also structural keys of a TS type — flows through its registry, used as `[REGISTRY.VARIANT]` in computed-key positions.

**What "domain-meaningful" means**:

- Names of step types, action codes, categories, tab kinds, field kinds, `Row` field names, etc. — anything a stakeholder would recognize as a concept.
- _Not_ generic structural keys with no domain meaning (e.g. `Record<string, T>`, `keyof SomeInternalCacheShape`) — those stay literal.

**How to find**: grep for `Partial<Record<keyof ` and `Record<keyof ` across `src/`. For each hit, check whether the literal keys correspond to entries in an existing registry (`ROW_FIELD`, `STEP`, etc.). If yes → rewrite as `[REGISTRY.VARIANT]:`. If no registry exists yet for that concept, _create one_ (the registry becomes the single grep target for the codebase).

**How to fix**: introduce or reuse a `[A-Z_]+` const-as-const for the concept; rewrite the literal keys as computed keys; export the registry from `entities/<feature>/model/`.

**Prevention**: convention: every domain-meaningful identifier has exactly one registry, and every reference uses `[REGISTRY.VARIANT]`. New code that introduces literal keys for a domain concept fails review.

**Cost we accept**: ~12 characters per usage in exchange for one find-replace per rename + one canonical grep target per concept. For a codebase aiming at zero-smell uniformity, that's a worthwhile trade.

**Genuine exceptions** (literal keys are correct):

- Generic structural maps that don't reference domain concepts: `Record<string, number>` for a counter cache.
- Keys of an external API response shape that we don't own.
- Keys typed by a generic parameter (`Record<keyof T, ...>` inside a generic helper) where the caller decides the concept.

---

## Class 28 — `interface` for object shapes instead of `type`

**Shape**: `interface` declarations for ordinary object/prop shapes throughout app code.

```ts
// Smell — declaration merging surprises, syntax inconsistency with unions/intersections.
interface CountChipProps {
  label: string;
  emphasis?: Emphasis;
}

interface RowDetailsPanelProps {
  row: Row | null;
  onUpdateRow: (id: string, updates: Partial<Row>) => void;
}
```

**Why wrong (in app code)**:

1. **Declaration merging is a footgun**: declaring `interface Foo` twice silently merges. With `type Foo`, the second declaration is a hard error — usually what you want, because accidental redefinition is a bug.
2. **Two tools for one job**: `interface` only describes object shapes. The moment you need a union, intersection, mapped type, conditional type, or branded primitive, you switch to `type`. The codebase ends up with a mix that varies by what each shape happens to need today — bad for consistency.
3. **`type` covers everything**: object shapes, unions, intersections, mapped types, `infer`, conditionals, primitives. One tool, one syntax for "this is the name of a type".

**Why `type` over `interface` is the better default**:

- One tool for all type aliasing — no syntactic switch when the shape grows a union.
- Hard error on accidental redeclaration.
- Same performance for typical app sizes (interface caching only matters for very large library declaration files).

**Genuine exceptions** (use `interface`):

- **Module augmentation** — extending a library type from a `*.d.ts` file (e.g. `interface Theme { custom: CustomPalette }` in `mui-theme.d.ts`). Declaration merging is the _feature_ you want here.
- **Public library API surface** — if the package is consumed externally and consumers may want to augment the type. Not applicable to this app codebase.

**How to find**:

```bash
grep -rEn '^(export )?interface \w+' frontend/src backend/src --include='*.ts' --include='*.tsx' \
  | grep -v '\.d\.ts'
```

Then sort the hits: any in `*.d.ts` for module augmentation → keep. Any other → convert to `type`.

**How to fix**: mechanical conversion.

```ts
// Before
interface CountChipProps {
  label: string;
  emphasis?: Emphasis;
}

// After
type CountChipProps = {
  label: string;
  emphasis?: Emphasis;
};
```

`interface A extends B` becomes `type A = B & { ... }` — equivalent but with the consistency bonus.

**Prevention**: ESLint `@typescript-eslint/consistent-type-definitions: ["error", "type"]`. The exception list (`*.d.ts` augmentation files) is configurable via overrides.

---

## Class 29 — Repeated sibling JSX with pure data variation

**Shape**: 3+ sibling JSX elements, structurally identical, differing only in a small set of data fields (testid, i18n key, count, label, click handler reference). No per-item conditional rendering, no per-item special children.

```tsx
// Smell — three near-identical Typography blocks differing only in testid + i18n key + count.
<Typography variant="caption" sx={{ color: c.textDim, fontSize: "0.7rem" }} data-testid="text-step1-row-count">
  {t(I18N.modal.step1Counter, { count: step1Count })}
</Typography>
<Typography variant="caption" sx={{ color: c.textDim, fontSize: "0.7rem" }} data-testid="text-step2-row-count">
  {t(I18N.modal.step2Counter, { count: step2Count })}
</Typography>
<Typography variant="caption" sx={{ color: c.textDim, fontSize: "0.7rem" }} data-testid="text-link-count">
  {t(I18N.modal.linkCounter, { count: linkCount })}
</Typography>
```

**Why wrong**: copy-paste duplication. Adding/removing/reordering items requires editing N+1 places (each block + the imports). Drift is cheap (someone changes `fontSize` on block 2 only). The structure of "this is a list" is invisible to the reader — they have to scan three blocks to confirm the only difference is the data.

**Distinct from neighbouring classes**:

- Class 23 is about _branching_ on a boolean (paired ternaries inside one element).
- Class 24 is about _dispatching_ on an enum-like discriminator.
- Class 25 is about helpers re-allocated per render.
- **Class 29 is about _repetition_ with pure data variation** — different fix shape (`.map()` over an array), different applicability test.

**How to fix**: extract a module-scope or in-component data array, render via `.map()`.

```tsx
const COUNTERS = [
  {
    testId: "text-step1-row-count",
    i18nKey: I18N.modal.step1Counter,
    count: step1Count,
  },
  {
    testId: "text-step2-row-count",
    i18nKey: I18N.modal.step2Counter,
    count: step2Count,
  },
  {
    testId: "text-link-count",
    i18nKey: I18N.modal.linkCounter,
    count: linkCount,
  },
];

return (
  <>
    {COUNTERS.map(({ testId, i18nKey, count }) => (
      <Typography
        key={testId}
        variant="caption"
        sx={{ color: c.textDim, fontSize: "0.7rem" }}
        data-testid={testId}
      >
        {t(i18nKey, { count })}
      </Typography>
    ))}
  </>
);
```

For per-counter handlers / refs, include them in the array entry. Keep the array module-scope when its contents don't depend on component state; declare it in the component body when they do (and stabilise with `useMemo` only if passed to memoised children).

**The when-to-apply test (all four must pass)**:

1. **Count**: 3+ siblings (2 is borderline — the array indirection may cost more than it saves).
2. **Structure**: identical wrapper element, identical static props.
3. **Variation**: differences are _data_ (string keys, count values, handler refs), not _behaviour_ (no per-item tooltip, no per-item conditional child).
4. **Future shape**: items are conceptually one list, not three independent things that happen to look alike. If divergence is likely soon (e.g. item 2 will grow a click handler and a tooltip while items 1 and 3 stay simple), keep inline.

Failing any of the four → keep inline. The array form is a tool for "this is a list", not for "these three things use the same wrapper today by coincidence".

**Where this pattern shows up in this codebase**: counter-chip rows (`DetailHeader`), stat cards, tab strips (RW-MODAL did `useRightTabConfig.tabs.map(...)` correctly), status indicators, button clusters with shared styling, form-field rows with shared layout, filter chip lists.

**How to find**:

1. Visual review: scan files for 3+ adjacent JSX elements with the same tag.
2. Heuristic grep: triple repetition of the same opening tag in close vertical proximity.
   ```bash
   awk '/<Typography/{c++; if(c>=3) print FILENAME":"NR; next} {c=0}' frontend/src/**/*.tsx
   ```
3. PR review lens: any time a diff adds a fourth item to a copy-paste list, that's the moment to convert.

**Prevention**: code review convention — if you find yourself copy-pasting a JSX element to add a third sibling, stop and convert all three to a `.map()`. ESLint custom rule (future): warn on 3+ adjacent siblings with identical opening-tag-plus-static-props signature.

---

## Class 30 — Props destructuring location and type-naming

**Shape**: a real component that takes `props: FooProps` and re-destructures inside the body, OR an inline anonymous type with many properties at the parameter position.

```tsx
// Smell — destructuring lives in the body, indirection without payoff.
function DetailStepGrid(props: DetailStepGridProps) {
  const { isLoading, isError, step1ByCategory, step2ByCategory, ... } = props;
  // ...
}

// Smell — inline anonymous type for a real component with many props.
function DetailStepGrid({ isLoading, isError, step1ByCategory, ... }: {
  isLoading: boolean;
  isError: boolean;
  step1ByCategory: Map<...>;
  // 10 more
}) {
  // ...
}
```

**Why wrong**: the body-destructure form adds an indirection (`const { ... } = props`) that buys nothing — every reader has to scan past it to get to the actual logic. The inline-anonymous-type form puts a multi-line type literal in the parameter slot, making the function signature unreadable and the type unreusable.

**The rule**:

- **Type alias is named**: declare `type FooProps = { ... }` (or `interface` only for module augmentation per Class 28).
- **Destructure in the signature**: `function Foo({ a, b, c }: FooProps)`. Not `function Foo(props: FooProps) { const { a, b, c } = props; }`.
- **Inline anonymous type is acceptable ONLY when**: (a) the function is a helper, not a real component, AND (b) ≤2 props.

```tsx
// Right — real component: named type, destructure in signature.
type DetailStepGridProps = {
  isLoading: boolean;
  isError: boolean;
  step1ByCategory: Map<Category, RowGroup>;
  // ...
};
function DetailStepGrid({ isLoading, isError, step1ByCategory, ... }: DetailStepGridProps) {
  // body starts immediately with logic
}

// Right — tiny helper, ≤2 props: inline anonymous type fine.
function FieldLabel({ children, bold }: { children: ReactNode; bold?: boolean }) {
  return <Typography ...>{children}</Typography>;
}
```

**Genuine exceptions**:

- Functions that need `props` as a whole (e.g. forwarded to another component, spread elsewhere) — keep `props: FooProps` and destructure only what's read inline.
- Generic functions where the type can't be hoisted cleanly — case-by-case.

**How to find**:

```bash
# Real components destructuring in body:
grep -rEn '^(export )?(default )?function \w+\([a-z]+:' frontend/src --include='*.tsx' \
  | grep -v '^.*\.d\.ts'
# Each hit needs review: is the parameter a non-destructured `props: FooProps`? If yes and the body opens with `const { ... } = props`, smell.

# Inline anonymous types with 3+ properties:
# Visual review or ESLint @typescript-eslint/no-inferrable-types-like rule (custom).
```

**How to fix**: pull destructure into the signature; pull anonymous types into a named alias.

**Prevention**: convention documented here. ESLint rule (future): forbid `function X(props: Y)` followed by `const { ... } = props` as the first statement.

---

## Class 31 — File-organization for components and primitives

**Shape**: violations of the "one real component per file, helpers co-located, sub-components in feature folders, primitives in shared/ui" convention.

```
// Right structure (canonical):
src/
  components/
    DetailizationModal.tsx          ← real component (orchestrator)
    detailization/                  ← feature folder for sub-components
      DetailHeader.tsx
      DetailStepGrid.tsx
      CountChip.tsx
      ...
    function-form/
      FunctionFormHeader.tsx
      ...
  shared/
    ui/
      TypeChip.tsx                  ← top-level shared primitive
      form/                         ← shared category folder
        FieldLabel.tsx
      grid-cells/
        TextWrapCell.tsx
      styles/                       ← sx-helper modules
        form.ts
```

**The rules**:

1. **One real component per file** — file name matches the default export. `DetailizationModal.tsx` → `export default function DetailizationModal`.
2. **Helpers (used once, presentational, no own state) live in the same file as their parent** — declared after the parent's `export default`, taking `c`/`theme`/`t` as props (Class 26).
3. **Sub-components (used 2+ times OR with their own state) live in a feature folder** — `src/components/<feature>/<SubComponent>.tsx`, one per file.
4. **Shared primitives (used across multiple features) live in `src/shared/ui/`** — directly for top-level primitives (`TypeChip.tsx`), in category subfolders for grouped primitives (`form/`, `grid-cells/`, `styles/`).
5. **Maximum two levels of nesting under `components/`** — `components/<feature>/<sub-feature>/<deepest>.tsx` is the floor. Past that, the "feature" should be a real top-level concept, not a pseudo-namespace.

**Why these rules**:

- File name = component name → the file system IS the component index. `Cmd+P "DetailHeader"` finds it.
- Feature folders co-locate things that change together. Renaming one feature's sub-component doesn't touch unrelated files.
- Shared category folders (`shared/ui/form/`, `shared/ui/grid-cells/`) keep the shared layer searchable when it grows.
- Two-level nesting cap forces a "is this really one feature?" check on every new folder.

**Why NOT a domain-segregated FSD layer cake everywhere**: this codebase uses `src/entities/<feature>/{model,types,constants,hooks,lib,config}` for the data layer (model definitions, hooks, schemas) and `src/components/<feature>/` for the UI layer. That's two layers, not five — keeping it simple. Don't introduce `widgets/`, `features/`, `pages/` (other than the actual page files) — over-engineering for an internal app.

**How to find**:

```bash
# Files with multiple exported components (likely violation of rule 1):
grep -rEn '^export (default )?function \w+\(' frontend/src/components --include='*.tsx' \
  | awk -F: '{print $1}' | sort | uniq -c | sort -rn | awk '$1 > 1 {print}'

# Components in src/components/ root that should probably be in a feature folder:
ls src/components/*.tsx  # review: does each top-level component still have ≤1 sub-folder of co-located files?
```

**How to fix**: move files. If a sub-component graduates from "used once, in same file" to "used twice, needs own file", extract to feature folder.

**Prevention**: code review checklist — every new component declares its layer (real / helper / sub / shared) before being placed.

---

## Class 32 — Test-id strings without a registry

**Shape**: `data-testid="some-id"` in components and `getByTestId("some-id")` in tests — same string typed twice, agreeing by convention.

```tsx
// Smell — string used in two places, has to be kept in sync by hand.
<Box data-testid="count-chip" />
<Typography data-testid="count-chip-label" />

// Test:
screen.getByTestId("count-chip");
screen.getByTestId("count-chip-label");
```

**Why wrong**: same as Class 27 / variant-split case — the string is a domain-meaningful identifier flowing through untyped channels (DOM attribute, test selector). Without a registry, IDE rename doesn't link the two sides, typos compile silently, and split refactors require grepping every test file.

**How to fix**: inline `*_TEST_IDS` registry exported from the component file. No separate `.test-ids.ts` file — that's needless proliferation; the registry lives next to the JSX it labels.

```tsx
// CountChip.tsx
export const COUNT_CHIP_TEST_IDS = {
  CONTAINER: "count-chip",
  LABEL: "count-chip-label",
} as const;

export function CountChip(...) {
  return (
    <Box data-testid={COUNT_CHIP_TEST_IDS.CONTAINER}>
      <Typography data-testid={COUNT_CHIP_TEST_IDS.LABEL}>...</Typography>
    </Box>
  );
}

// CountChip.test.tsx
import { COUNT_CHIP_TEST_IDS } from "./CountChip";
screen.getByTestId(COUNT_CHIP_TEST_IDS.CONTAINER);
```

**Why inline beats `*.test-ids.ts` siblings**:

- Zero new files — each component already has one file; registry adds 3-5 lines.
- Registry sits next to JSX — easier to spot stale entries when refactoring.
- One import on the test side pulls both the component and its testids.

**For tests** (this codebase's `frontend/e2e/`): import the registry. Playwright `page.getByTestId(COUNT_CHIP_TEST_IDS.CONTAINER)` works the same way.

**Genuine exceptions**:

- One-off testids used in exactly one test that's unlikely to change — fine to keep a literal. Test runs and shipping speed beat marginal symbol benefits.
- Testids generated dynamically (`data-testid={`row-${id}`}`) — no static registry possible; a constant prefix is the closest registry-like form.

**How to find**:

```bash
# All testid literals across components:
grep -rEn 'data-testid="[^"]+"' frontend/src --include='*.tsx'
# Cross-reference with frontend/e2e to see which are actually used by tests.
```

**Prevention**: convention — every component with 2+ testids exposes a registry. Single-testid components may inline. ESLint custom rule (future): forbid string literal in `data-testid` if the value is also referenced by `getByTestId` in a sibling test file.

---

## Class 33 — Nested ternary for derived value (3+ outcomes)

**Shape**: a `condition ? a : condition2 ? b : c` chain producing a derived value (often a JSX element, icon, label, or className).

```tsx
// Smell — three outcomes, two levels of ternary nesting, hard to scan.
const submitIcon = submitting ? (
  <CircularProgress size={14} />
) : isEdit ? (
  <Save sx={{ fontSize: 16 }} />
) : (
  <Add sx={{ fontSize: 16 }} />
);

// Smell — same shape with strings/labels:
const status = isError
  ? "Error"
  : isLoading
    ? "Loading"
    : isEmpty
      ? "No data"
      : "Ready";
```

**Why wrong**: human readers parse ternary precedence by counting `?`/`:` tokens — fine for one level, exhausting at two, broken at three. The intent ("3+ exclusive outcomes") is buried under operator soup. A reviewer can't tell at a glance whether `b` is the second-level true branch or the second-level false branch.

**Distinct from Class 23/24**:

- Class 23 is paired-ternary _styling_ on a single boolean inside one element's `sx`.
- Class 24 is `if (x === A) ... else if (x === B) ... else if (x === C)` chains on an enum-typed discriminator.
- Class 33 is _nested_ ternaries (2+ levels) producing one derived value, often on multiple boolean flags.

**How to fix** — three reasonable forms in increasing weight:

```tsx
// (1) Sequence of if-returns inside a small helper — best for 3 cases.
function SubmitIcon({
  submitting,
  isEdit,
}: {
  submitting: boolean;
  isEdit: boolean;
}) {
  if (submitting) return <CircularProgress size={14} />;
  if (isEdit) return <Save sx={{ fontSize: 16 }} />;
  return <Add sx={{ fontSize: 16 }} />;
}

// (2) Same shape but as an inline IIFE if you want the value inside the parent's render.
const submitIcon = (() => {
  if (submitting) return <CircularProgress size={14} />;
  if (isEdit) return <Save sx={{ fontSize: 16 }} />;
  return <Add sx={{ fontSize: 16 }} />;
})();

// (3) Enum + dispatch table — overkill for 3 cases, right for 5+.
const SUBMIT_MODE = {
  SUBMITTING: "submitting",
  EDIT: "edit",
  CREATE: "create",
} as const;
type SubmitMode = (typeof SUBMIT_MODE)[keyof typeof SUBMIT_MODE];
const ICON_BY_MODE: Record<SubmitMode, ReactElement> = {
  [SUBMIT_MODE.SUBMITTING]: <CircularProgress size={14} />,
  [SUBMIT_MODE.EDIT]: <Save sx={{ fontSize: 16 }} />,
  [SUBMIT_MODE.CREATE]: <Add sx={{ fontSize: 16 }} />,
};
const submitIcon = ICON_BY_MODE[deriveSubmitMode(submitting, isEdit)];
```

**Choosing the form**:

- 3 outcomes, simple flag combination, one usage → form (1) or (2).
- 5+ outcomes OR a real enum-typed discriminator → form (3).
- JSX-returning case AND used 2+ times → real sub-component (form 1 promoted out of the file).

**How to find**: ESLint `no-nested-ternary` is built-in and catches every instance. Enable it.

**Prevention**: ESLint `no-nested-ternary: "error"`. The rule has no false positives — every hit is a real Class 33 instance.

---

## Rules as the document grows

- Add a class when you find something new.
- Collapse classes when two you wrote turn out to be the same issue.
- If a class is "zero instances" for 3 months, move it to an archive section — it's not active debt anymore.
- The ultimate goal: **this document has as many classes as the codebase deserves — not more, not less**.
