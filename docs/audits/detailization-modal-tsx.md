# Audit: `components/detailization-modal.tsx`

Scope: single-file read-only review. Line numbers reference the file at HEAD.

---

## 1. Summary

- **Quality rating: 2 / 5** — functionally correct, visibly mature in places (e.g. layout-sync guard at L143), but the file is an un-decomposed god-component that mixes six responsibilities with no internal boundary.
- **LOC now: 1177.** Realistic post-refactor target for this file: **~160 LOC of pure orchestration** (Dialog shell, data hooks, sub-component wiring).
- **3 biggest structural issues:**
  1. **Inline JSX megablock (L725–L1174).** 450-line JSX tree renders title, step grid, sticky headers, category rows, resize handle, tab bar, four tab bodies, snackbar. No sub-components. Two 70-line sticky grid blocks (L862–L966) are copy-paste.
  2. **Resizable-panel state hand-wired in-component (L123–L164).** Ref pair + layout effect + storage effect + onLayout heuristic (L824–L837) — textbook custom-hook candidate.
  3. **Five inline `renderXxx` functions + seven `useCallback` mutation handlers (L308–L552)** hang off the component closure. Combined with tab bodies, function length blows past the 80-LOC rule.
- **Responsibilities this file owns (6 — any >3 is a smell):**
  1. Redux glue for modal open / selection / tab / snackbar
  2. Data fetching + cache-dependent mutation dispatch (7 mutations inline)
  3. Row/link derivation (9 `useMemo`s at L202–L306)
  4. Resizable-panel measurement + persistence
  5. Step table rendering (header, category banner, data row, action chip)
  6. Right-side tabbed panel (4 tabs) wiring

---

## 2. Classes from `patterns.md` present

| #   | Class                               | Present                                                                                                                                                                                         | Evidence                                                                                                                                                                                                                  |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Hardcoded Russian UI strings        | **Yes, heavy**                                                                                                                                                                                  | L338/349/370/381/396/415/430/445/493/518 snackbar messages; L538 "Не указано"; L696–L698 column headers; L768/775 title; L784/791/798 counters; L856 error; L904/939 step titles; L1029 "связей"; L1111–L1115 tab labels. |
| 2   | String unions instead of enums      | Not in this file; types imported.                                                                                                                                                               |
| 3   | Repetitive inline `sx` blocks       | **Yes, severe**                                                                                                                                                                                 | L565–L592 row `sx` (28 lines); L1002–L1012 and L1014–L1026 identical chip `sx` copied; L1092–L1108 tabs `sx`.                                                                                                             |
| 4   | Manual form validation              | N/A (delegated).                                                                                                                                                                                |
| 5   | Missing hook deps                   | Clean — L143 and L157 effects have correct deps.                                                                                                                                                |
| 6   | Huge multi-responsibility component | **Yes, primary offense.** 1177 LOC, 6 responsibilities.                                                                                                                                         |
| 7   | Magic numbers                       | **Yes.** L102 `340`; L108 / L149–L151 / L1076 `25 / 60` (repeated 3×); L125 `30`; L832 `0.5`; L841 `40`; L1084 `320`; L1163 `5000`.                                                             |
| 8   | Unused deps                         | N/A.                                                                                                                                                                                            |
| 9   | Dictionary FKs as display strings   | Not present here.                                                                                                                                                                               |
| 10  | `--no-verify`                       | N/A.                                                                                                                                                                                            |
| 11  | Utility proliferation               | Mild: `renderActionChip`, `renderDataRow`, `renderColumnHeaders`, `renderTableForCategory` (L536–L719) — extract.                                                                               |
| 12  | Direct env access                   | Not present.                                                                                                                                                                                    |
| 13  | Nested ternary                      | **Yes.** L571–L575 and L577–L582 `bgcolor` nested ternaries.                                                                                                                                    |
| 14  | Hardcoded enum literals             | Borderline — `rightTab === 0/1/2/3` (L1122–L1145) are magic ints; team rule requires `RightTab` enum-like.                                                                                      |
| 15  | Repeated filter+map                 | Minor — L255/L256 split by step with two filters; merge into one pass.                                                                                                                          |
| 16  | Repeated options                    | N/A — uses `DETAIL_QUERY_OPTIONS` / `DICTIONARY_QUERY_OPTIONS`.                                                                                                                                 |
| 17  | Inline business logic               | **Yes.** `handleSaveDual` (L464–L526, 60 lines) and `handleCreateLinks` (L424–L454) belong in `entities/fts-function/api/`. `colorByCode` builder (L202–L206) belongs in the dictionary module. |

---

## 3. Design-level issues

Ordered by impact.

### 3.1 The resizable-panel dance is a custom hook (L123–L164, L817–L838)

Two refs + two state slots + `useLayoutEffect` + storage `useEffect` + the `onLayout` "deviation" heuristic at L830–L834 are all **one concept**: "a user-resizable panel with a default in px and localStorage persistence, gated by user-interaction." Today it's smeared across 40+ lines of the component body. Extract:

```ts
const { containerRef, panelGroupRef, rightPct, onLayout } = useResizablePanel({
  defaultPx: 340,
  storageKey: PANEL_WIDTH_KEY,
  min: 25,
  max: 60,
});
```

### 3.2 Tab bodies switch is an if-chain, not a Record map (L1122–L1152)

Four `{rightTab === N && <…/>}` blocks. standards.md §"Conditional Rendering by Enum" mandates a `Record<RightTab, ReactNode>` for 3+ branches. Also `rightTab === 3 && selectedRow` smuggles a precondition that belongs in the Panel component itself (disabled tab already exists at L1116).

### 3.3 Step grid header + column-header blocks are copy-paste (L862–L966)

The "Step title" bar for step 1 (L873–L906) and step 2 (L908–L941) differ only in: dot color (`primary.main` vs `success.main`), testid, label. Then the column-header row (L944–L966) renders `renderColumnHeaders()` twice inside two `TableContainer`s wrapped in an identical 3-column grid. Extract `<StepHeaderRow step1Label step2Label />` and a `<TwoColumnRow>` layout primitive, or build a `STEPS` config array `[{ step: 1, dotColor, titleI18n }, { step: 2, ... }]` and `.map()`.

### 3.4 The category section (L968–L1062) is a 95-line inline `.map` body — breaks standards.md's "5+ lines → extract" rule

Inside it, two `<Chip>` blocks (L1001–L1013 and L1014–L1026) have identical `sx`; extract `<CountChip label={...} />`. The whole `<Fragment key={cat}>` body is `<CategorySection step1={s1} step2={s2} category={cat} linkCount={...} />`.

### 3.5 `renderDataRow` (L554–L690) is 137 lines and selection/link/dim logic is a ternary swamp (L571–L591)

Selection state has exactly four discrete presentations: `SELECTED`, `LINKED`, `DIMMED`, `NORMAL`. Make an enum and a `Record<RowPresentation, RowStyles>` lookup. Also extract `<DataRow row index />` — it owns no state that isn't derivable from props.

### 3.6 Nine `useMemo`s derive overlapping data from `rows`+`links` (L214–L306)

Collapse into one `useStepRowsModel(functionRecord)` hook returning `{ rows, links, rowMap, step1, step2, step1ByCategory, step2ByCategory, step1IndexMap, step2IndexMap, linkCountsPerCategory }`. Single pass over rows where possible. `selectedLinks` and `linkedIds` both traverse `links` with `selectedId` — merge into `useSelectionLinks(links, selectedId)`.

### 3.7 Mutation handlers should be one hook, not seven in-component callbacks (L324–L527)

`handleAddRow`, `handleUpdateRow`, `handleRemoveRow`, `handleRemoveLink`, `handleCreateLinks`, `handleQuickLink`, `handleSaveDual` share: `typesAll`, `rowMap`, `modalFunctionId`, `dispatch`, and the same `void (async () => { try/catch-middleware })()` wrapper pattern (pattern Class 11 — parameterless proliferation of identical scaffolding). Wrap once:

```ts
const actions = useDetailActions({
  modalFunctionId,
  typesAll,
  rowMap,
  selectedId,
});
// actions.addRow, actions.update, actions.remove, actions.link, actions.unlink, actions.saveDual
```

The `void IIFE` is an anti-pattern — replace with `.unwrap().then().catch()` or a shared `runMutation()` helper that owns the snackbar-on-failure policy.

### 3.8 Magic-integer `rightTab` + modal slice mix concerns

`rightTab` is numeric (L181, L1122–L1145, L447, L516). Per standards.md it must be a `RightTab` const object. Also: the slice owns modal open + selected row + right tab + link-picker navigation + snackbar — a lot of coordinated state. Not strictly a `useReducer` case (it's already a slice), but the modal-local coordination (tab ↔ selection ↔ link-picker intent) would read clearer as a tagged-union state machine: `{ kind: "BROWSE" } | { kind: "ROW_SELECTED", rowId, tab } | { kind: "PICKING_LINKS", sourceRowId }`.

### 3.9 Hardcoded strings block i18n (pattern Class 1)

20+ Russian literals. A later i18n migration will touch this file on every string.

### 3.10 Snackbar rendered here couples modal lifecycle to toast lifecycle (L1161–L1174)

Toast is global UX; rendering it inside `<DetailizationModal>` means it disappears when the modal closes. Move to app shell.

---

## 4. Declarative rewrite opportunities

- **Tabs → config array.** L1111–L1119 declares 4 `<Tab>`s and L1122–L1152 renders 4 conditional bodies. Unify:
  ```ts
  const TABS: TabDef[] = [
    { id: RightTab.LINKS,   label: I18N.tabLinks,   render: () => <LinksPanel .../> },
    { id: RightTab.DETAILS, label: I18N.tabDetails, render: () => <RowDetailsPanel .../> },
    { id: RightTab.ADD,     label: I18N.tabAdd,     render: () => <AddItemForm .../> },
    { id: RightTab.LINKER,  label: I18N.tabLinker,  disabled: !selectedRow,
      render: () => selectedRow && <LinkPicker .../> },
  ];
  ```
  One `.map` for the headers, lookup `TABS[rightTab].render()` for the body.
- **Row presentation → `Record<RowPresentation, SxProps>`** replaces the ternary swamp at L571–L591.
- **Steps → config.** `STEPS = [{ step: 1, dotColor: 'primary.main', title: ... }, { step: 2, ... }]` drives the sticky header row and the per-category two-column layout.
- **Mutation → snackbar messages** (L349, L381, L396, L415, L445, L518) are six variants of one event; a `runMutationWithToast(action, { success, pending })` helper collapses them.

---

## 5. Sub-component extraction plan

Target: this file drops to ≤ 200 LOC of orchestration.

| Component                | Replaces lines                                   | Internal state | Props                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<DetailHeader>`         | L750–L811 (title + counts + close, ~60)          | none           | `title, step1Count, step2Count, linkCount, onClose`                                                                                                                                      |
| `<DetailStepGrid>`       | L860–L1062 (loading/error/grid/categories, ~200) | none           | `isLoading, isError, step1ByCategory, step2ByCategory, step1IndexMap, step2IndexMap, linkCountsPerCategory, selectedId, linkedIds, onRowClick, onRemoveRow, registerRowRef, colorByCode` |
| `<StepTitleRow>`         | L862–L942 (~80)                                  | none           | `steps: StepDef[]`                                                                                                                                                                       |
| `<StepColumnHeaderRow>`  | L944–L966 (~22)                                  | none           | none (pure)                                                                                                                                                                              |
| `<CategorySection>`      | L978–L1061 (~85)                                 | none           | `category, step1Rows, step2Rows, linkCount, colors, selection, indexMaps, handlers`                                                                                                      |
| `<DataRow>`              | L554–L690 (~135)                                 | none           | `row, indexNumber, presentation, onClick, onRemove, registerRef, colorByCode`                                                                                                            |
| `<CountChip>`            | L1001–L1026 twice (~25)                          | none           | `label, tone?`                                                                                                                                                                           |
| `<ActionChip>`           | L536–L552 (~17)                                  | none           | `action, actionColors, colorByCode`                                                                                                                                                      |
| `<DetailRightPanel>`     | L1076–L1154 (~80)                                | none           | `selectedRow, rows, links, rowMap, selectedLinks, rightTab, onTabChange, actions`                                                                                                        |
| `<DetailRightPanelTabs>` | L1088–L1119 (~30)                                | none           | `value, onChange, canPick`                                                                                                                                                               |

Main file after extraction = imports + `useDetailQuery` + `useStepRowsModel` + `useResizablePanel` + `useDetailActions` + one JSX block wiring `<Dialog>` → `<DetailHeader>`+`<PanelGroup>(<DetailStepGrid/>, <DetailRightPanel/>)`. Roughly **150–180 LOC**.

---

## 6. Custom hook extraction plan

| Hook                 | Signature                                                                     | Returns                                                                                                                                     | LOC                                                                         |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `useResizablePanel`  | `(opts: { defaultPx: number; storageKey: string; min: number; max: number })` | `{ containerRef, panelGroupRef, pct, onLayout }`                                                                                            | owns L123–L164 + L824–L837 ≈ 60 LOC folded into ~35 in the hook             |
| `useStepRowsModel`   | `(functionRecord: FtsFunctionRecord \| null)`                                 | `{ rows, links, rowMap, step1, step2, step1ByCategory, step2ByCategory, step1IndexMap, step2IndexMap, linkCountsPerCategory, colorByCode }` | replaces L202–L306 and L214–L227 ≈ 95 LOC → ~60                             |
| `useSelectionLinks`  | `(links: Link[], selectedId: string \| null)`                                 | `{ linkedIds, selectedLinks, selectedRow }`                                                                                                 | L283–L302 ≈ 20 LOC                                                          |
| `useDetailActions`   | `(ctx: { modalFunctionId, typesAll, rowMap, selectedId })`                    | `{ addRow, updateRow, removeRow, createLinks, removeLink, quickLink, saveDual }`                                                            | replaces L324–L527 ≈ 200 LOC → ~120 (shared `runMutation` helper does half) |
| `useRightTabConfig`  | `(ctx: { selectedRow, rows, links, rowMap, actions })`                        | `TabDef[]`                                                                                                                                  | new, ~35 LOC; consumes `RightTab` enum                                      |
| `useRowPresentation` | `(selectedId, linkedIds)`                                                     | `(row) => RowPresentation`                                                                                                                  | ~10 LOC; drives the ternary-removed style map                               |

---

## 7. Prioritized action list

Ordered by (impact × ease).

1. **Extract `<DataRow>` + `<CategorySection>` + `<StepTitleRow>`.** Pure mechanical. Kills ~340 LOC from this file, fixes pattern Class 6 and the in-JSX-map 5-line rule. Before: L554–L690, L862–L942, L968–L1062 inline. After: three components in `components/detailization-modal/ui/`, rendered by name.
2. **`useResizablePanel` hook.** 40 scattered lines → one import. Before: L123–L164 + L824–L837. After: `const { containerRef, panelGroupRef, pct, onLayout } = useResizablePanel({…})`.
3. **`useDetailActions` hook with shared `runMutation` helper.** Before: 7 `useCallback`s × ~25 LOC each with repeated `void (async IIFE + try/catch empty)`. After: one hook, one helper that calls `showSnackbar` on rejection consistently. Also fixes Class 17.
4. **`RightTab` enum-like + `TABS` config array + `Record<RightTab, ReactNode>` body lookup.** Before: L1088–L1152 imperative. After: config + `.map`. Fixes standards.md §Conditional Rendering and §Enum-like Objects.
5. **`useStepRowsModel` hook.** Collapses 9 `useMemo`s into one cohesive returned object.
6. **Replace ternary-swamp with `rowPresentation` record** (L571–L591). Extract to `styles/data-row.ts` as a `Record<RowPresentation, SxProps>` function of theme tokens.
7. **i18n sweep.** Move all 20+ Russian literals to `shared/i18n/ru/detail.json` with typed keys. Big diff, low risk, unblocks future translation.
8. **Promote Snackbar to app shell** (L1161–L1174). Toasts belong outside modal lifecycle.
9. **Introduce `CountChip`** (L1001–L1026 twice, other chip sites in `CategorySection`). One primitive replaces 3 copies.
10. **Named constants** for 25 / 60 / 340 / 30 / 0.5 / 5000 (pattern Class 7). Put in `shared/config/ui.ts` alongside `HEAD_HEIGHT` et al.

---

## 8. What's good

- **Selector-based Redux access** (L179–L182) — no prop drilling for modal identity.
- **Query options are reused constants** (L190, L200) — already satisfies Class 16.
- **Row/link derivation uses pure helpers** (`groupRowsByCategory`, `buildRowIndexMap`, `countStep1LinksByCategory`, `mapFtsFunctionDetailApiToRow`) — logic lives in `entities/fts-function/lib/*`, not inline. Extend that discipline to the rest of the file.
- **Layout-effect sync** (L143–L156) is correctly `useLayoutEffect`, properly guarded (`didInitialSyncRef`, `hasStoredWidth`), with a good "why" comment at L136–L142.
- **The `onLayout` deviation > 0.5% heuristic** (L830–L834) correctly distinguishes programmatic from user-driven layout changes. Subtle and right — preserve when extracting to `useResizablePanel`.
- **Type-safe throughout**; no `any`.
- **`TypeChip` primitive** already used (L538, L544) — extend that shared-primitive direction to `CountChip`.
- **Ref map for scroll-into-view** (L229, L318, L528–L534) is a tidy imperative-DOM escape hatch.
