# Audit — `frontend/src/pages/home.tsx`

Target: `/home/Kristy/Desktop/dima-asap-help-food/fts-functions/registry-functions/registry-functions/frontend/src/pages/home.tsx` (1214 LOC).

## 1. Summary

- **Rating: 2 / 5.** Abstractions have started (dictionary hook, translators, query-options constants) but the file is a catch-all: paging state machine, delete-dialog flow, theme toggle, column DSL, and a 185-line Dialog all inline.
- **Top 3 issues:**
  1. Cursor-paging + polling state (137–259): 6 `useState` + 3 effects with a disabled exhaustive-deps — belongs in `useCursorPagedList`.
  2. 335-line `columns` useMemo (331–680) mixes schema with 9 near-identical styled-`<Box>` cells.
  3. 185-line inline delete `<Dialog>` (1025–1211) with two-step machine — extract `<DeleteFunctionDialog />`.
- **LOC target: ~1214 → ~350.**

## 2. Patterns.md class check

- **Class 1 (Cyrillic)** — found at 354, 380, 395, 410, 420, 447, 487, 526, 541, 554, 585, 606, 627, 648, 718, 783, 789, 855, 882, 896, 1057, 1082, 1098, 1102, 1117, 1157, 1173, 1188, 1206.
- **Class 2 (string unions)** — found. `mode === "dark"` (797, 1041, 1168, 1200); `panelMode: "create" | "edit"` (100); `deleteStep === 1/2` (1076, 1086, 1146, 1177) — numeric enum smell.
- **Class 3 (repetitive sx)** — pervasive. `{ whiteSpace:"normal", wordBreak:"break-word", lineHeight:1.35, width:"100%", py:0.5 }` repeats at 432, 469, 563, 591, 611, 632, 653. DataGrid sx (936–1011) is 75 lines. Captcha TextField sx (1120–1139).
- **Class 4 (manual validation)** — mild. `captchaInput !== DELETE_CAPTCHA` duplicated 4× (273, 1113, 1116, 1193).
- **Class 5 (deps)** — line 218 `eslint-disable exhaustive-deps` — shape is wrong, see §3.
- **Class 6 (mega component)** — 1214 LOC, 4× the 300 LOC standard.
- **Class 7 (magic numbers)** — icon `fontSize:14/16/18/20` throughout columns; `rowBufferPx={2000}` (928); `maxWidth:1600` (740); `width:64` (336), `108` (355), `320` (857); `deleteStep === 1/2` (1076/1086); **bug**: hardcoded `"9967"` (1098) duplicates `DELETE_CAPTCHA` — drift hazard.
- **Class 8** — n/a.
- **Class 9 (dictionary FK as string)** — line 541 `params.value === "Да"` branches on Russian display value.
- **Class 10** — n/a.
- **Class 11, 12** — not found.
- **Class 13 (nested ternaries)** — `mode === "dark" ? A : B` repeated at 797, 1040, 1167, 1198; belongs in theme.
- **Class 14 (hardcoded enum literals)** — line 287 `t.code === "DEBT_SETTLEMENT"` should import from `@registry/shared`.
- **Class 15, 16** — not found (already using `useDictionary` + shared query options).
- **Class 17 (inline business logic)** — `colorByCategoryName` + `lookupTypeByName` (294–308) is a pure reverse-index hook candidate; the sync effect (196–219) carries state-machine rules.

## 3. Design-level issues

1. **Paging state = 6 `useState` + 3 `useEffect`** (137–259). All transition together; the `eslint-disable` at 218 is the tell. Extract `useCursorPagedList<Item>({ baseArgs, firstPageQuery, fetchList, thresholdPx })` backed by `useReducer` with `FIRST_PAGE_LOADED | MORE_PAGE_LOADED | RESET | ERROR | LOADING`.
2. **Delete dialog in its own component** (1025–1211). State already in Redux — the whole dialog is derivable from `selectDeleteDialog` + `deleteTarget`. Extract `<DeleteFunctionDialog />`.
3. **Theme toggle is orthogonal** (792–802). Belongs in an app-chrome widget, not a page.
4. **Sync `useEffect` (196–219) should be derived state.** The only real logic — "don't overwrite rows after scroll" — is the state machine's job (§3.1), not an effect.
5. **`openEdit` imperative cluster** (310–317): sets 3 states + RAF scroll. Merge with `handleCancelEdit` + `handleTogglePanel` into a `useReducer` over `{ panelMode, editingId, panelExpanded }` or a `usePanel` hook. Also: rename to `handleOpenEdit` (standards: local handlers are `handleX`).
6. **Columns inline** (331–680). 9 columns × ~30 lines. Move to `entities/fts-function/ui/columns.tsx` exporting `buildColumns({ c, options, handlers, lookupTypeByName })`.
7. **Cell-`<Box>` pattern duplicated 7×** (Class 3). Introduce `<TextCell align value sx={c.cellBodySx}/>` or a `cellSx.wrap` const.
8. **`renderListStatus` returns JSX from an inner function** (682–724) and is called as `renderListStatus() ?? <DataGrid/>` (906) — violates the "don't store JSX in variables" rule. Replace with a `<ListStatus ... />` helper component and branch in JSX.
9. **Element-ordering (26-step) violations:**
   - `handleX` callbacks (310–326) _after_ most `useEffect`s (192–259) — `useCallback` is step 19, before `useEffect` (step 20).
   - `deleteTarget` (266–268) is a derived value sitting between `useMemo` and `useCallback` — should be in the derived-values block (step 18).
   - `[softDeleteFn]` mutation (270, step 14) lives below `useMemo`/`useState` — scrambled.
   - `gridContainerRef` (221, `useRef` step 17) placed after effects — out of order.
10. **No named export / props type.** `export default function Home()` — standards require named exports and `type HomePageProps` even for zero props.
11. **`slotProps.row` contains only a comment** (930–934) — dead config next to a working `slots.row` (1012). Remove; readers will assume the comment is load-bearing.
12. **`filterable: false` + justifying comment repeated** at 493, 531. Encode via `nonFilterableColumn(...)` helper rather than re-commenting.

## 4. Declarative rewrite opportunities

- **Columns (331–680):** hand-written array. → `COLUMNS: ColumnSpec[]` with `kind: 'textWrap' | 'typeColored' | 'chipList' | 'actions'` + renderer registry. Adding a column = 1-line config change.
- **Dialog step branching (1076–1209):** `&&`-chains per step → `Record<DeleteStep, ReactNode>` (standards explicitly prescribe this; TS errors on missing keys).
- **`mode === "dark" ? x : y` ×4 (797, 1040, 1167, 1198):** move to theme (`c.backdrop`, `c.dangerHoverStrong`, `<ThemeIcon mode/>`). Page stops knowing about dark/light.
- **Step bodies (1076–1143):** `<ConfirmStep />` and `<CaptchaStep />` sub-components selected by the Record above — each independently testable.

## 5. Extraction opportunities

- `useCursorPagedList()` (lines 137–259) → `entities/fts-function/hooks/useCursorPagedList.ts`. **Removes ~100 LOC** from Home.
- `buildColumns({ c, options, handlers, lookupTypeByName })` (331–680) → `entities/fts-function/ui/columns.tsx` + `cellRenderers.tsx`. **Removes ~340 LOC.**
- `<DeleteFunctionDialog />` (1025–1211) → `features/delete-fts-function/ui/DeleteFunctionDialog.tsx`. **Removes ~185 LOC.**
- `useTypeColorLookup(types)` (282–308) → `entities/fts-function/hooks/useTypeColorLookup.ts`. Pure reverse-index + callback. **Removes ~25 LOC.**
- `<ListStatus loading isError />` (682–724) → colocate in same file as helper component (below main, per agario rule). **Removes ~40 LOC, replaces imperative `renderListStatus()` call.**
- `<RegistryHeader title subtitle onToggleTheme mode />` (749–803) → `widgets/registry-header`. **Removes ~55 LOC.**
- `cellSx.wrapLeft / wrapCenter` + `textCellSx(c)` → `shared/ui/styles/table.ts`. **Removes ~50 LOC of duplicated inline sx.**

Total estimated reduction: ~795 LOC → Home approaches ~420 LOC before further polish, ~350 LOC after `dataGridSx` extraction.

## 6. Prioritized action list

1. **[M]** Extract `<DeleteFunctionDialog />`. Biggest visual reduction, lowest risk (Redux-backed state already isolated). Replace `deleteStep === 1/2` with a `DeleteStep` const-as-const enum.
2. **[L]** Extract `useCursorPagedList` hook, convert the sync `useEffect` into a reducer. Kills the `eslint-disable` at 218 and makes the paging logic testable.
3. **[M]** Move `buildColumns` + cell renderers to `entities/fts-function/ui/columns.tsx` with a typed column-spec DSL.
4. **[S]** Rename `openEdit` → `handleOpenEdit`, reorder hooks per the 26-step rule, add `export type HomePageProps = Record<string, never>` + `export function HomePage`.
5. **[S]** Replace `"Да"` (541) with dictionary-resolved value (Class 9 fix); replace `"DEBT_SETTLEMENT"` (287) with `FtsMarkerCode.DEBT_SETTLEMENT` enum.
6. **[S]** Extract shared cell wrapper styles to `shared/ui/styles/table.ts`; extract DataGrid sx to `registryGridSx(c)`.
7. **[S]** Move theme-toggle button + registry header into a shared widget, lift i18n strings into `shared/i18n/ru/registry.json` (knock out ~30 Class 1 hits at once).

## 7. What's good

- Polling trade-off is _documented_ in prose (172–183, 201–212, 216–218) — explains "why". Preserve when extracting.
- Uses `useDictionary`, `DICTIONARY_QUERY_OPTIONS`, `LIST_QUERY_OPTIONS`, `translateFilterModel`/`translateSortModel`, `buildConstantsLookup`, and config constants — Classes 7/15/16/17 partially addressed.
- `singleSelectIsAnyOfOps` memo with its comment (130–134) is the right shape.
- `baseArgs` follows Class 17's prescribed translator pattern almost verbatim (162–170).
- `data-testid` attributes are consistent and parameterized (e.g. `button-edit-function-${id}`) — preserve.
- `Category` enum used from `@registry/shared` for category checks (87, 123–127, 286, 457, 536).
