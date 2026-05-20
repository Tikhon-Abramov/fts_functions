# Audit 03 — Architecture / Component Responsibility Map

> Why does the codebase feel "split"? This audit walks every key component, hook, and module — names its purpose in one sentence, what it owns, what it leaks. Then traces 3 user-actions through every file they touch, flagging non-obvious jumps.

## Top 5 architectural problems

1. **`addRow` returns `""` synchronously** while the actual id only exists inside an async closure → `lastSavedId` permanently null → QuickLink button never appears. **Type contract is structurally lying.**
   → Fix: `addRow: (...) => Promise<string>`; AddItemForm awaits.

2. **`DetailizationModal` is a 277-line god-coordinator** wiring 5 hooks + 4 panels + all callbacks as inline render-prop closures inside `useRightTabConfig`.
   → Fix: extract `<DetailRightPanelContent tab={...} />` that owns panel selection.

3. **`PRIMARY_FIELDS` (in `extra-fields.ts`) drives the edit form, but `RowDetailsView.tsx` has its OWN hardcoded layout for the same primary fields.** Add a primary field → edit two unrelated files.
   → Fix: have `RowDetailsView` iterate `PRIMARY_FIELDS` too. One source of truth.

4. **`LinkPicker` fires its own `useConstantControllerGetTypesV1Query`** while every sibling already gets `typesAll` from the modal. Hidden network round-trip, no shared cache.
   → Fix: `typesAll` becomes a prop.

5. **`useRightTabConfig` takes 4 inline render closures from the modal** — adds an indirection hop without reducing coupling.
   → Fix: pass data props into `DetailRightPanel`, let it own the switch internally.

---

## Component / Hook Responsibility Map

### `DetailizationModal.tsx`

- **Purpose**: Top-level modal orchestrator — loads function record, instantiates all domain hooks, passes results to every child panel.
- **Owns**: All 5 hook instances (`useStepRowsModel`, `useSelectionLinks`, `useRowPresentation`, `useDetailActions`, `useRightTabConfig`), all Redux dispatch callbacks, `rowRefs` map, 4 inline render-prop closures.
- **Leaks**: Knows AddItemForm's `allRows`/`typesAll` needs, LinksPanel's `rowMap`/`allLinks`, RowDetailsPanel's `row`/`typesAll`/`onUpdateRow`, LinkPicker's `sourceRow`/`allRows`/`existingLinks` — assembled inline. Any addition to any child panel propagates back into this one file.

### `DetailStepGrid.tsx`

- **Purpose**: Renders left-panel grid of two steps grouped by category, handling loading/error.
- **Owns**: Category color lookup; otherwise pure display.
- **Leaks**: Accepts `presentation: RowPresentationResolver` (function type from sibling hook), coupling it to `useRowPresentation`'s exact return type.

### `DetailHeader.tsx`

- **Purpose**: Modal title bar with step/link counters + close button.
- **Owns**: Nothing — fully controlled.
- **Leaks**: None. Clean.

### `DetailRightPanel.tsx`

- **Purpose**: Tab strip + single body slot for the right panel; active body looked up from `tabs` by `rightTab` id.
- **Owns**: One-liner `find` for tab lookup.
- **Leaks**: `tabs` prop shape (`RightTabDef[]`) couples it to `useRightTabConfig`'s return type.

### `RowDetailsPanel.tsx`

- **Purpose**: Switches between view and edit mode for a selected row's detail passport.
- **Owns**: Edit/view toggle by delegating to `useRowDetailsDraft`.
- **Leaks**: Passes `draft` (a `Partial<Row>`) and `typesAll` into `RowDetailsEdit`, so it must know RowDetailsEdit's exact data dependencies. `handleSave` merges `row.id + draft`.

### `RowDetailsEdit.tsx`

- **Purpose**: Edit form for a detail row, rendering all fields from `PRIMARY_FIELDS + EXTRA_FIELDS`.
- **Owns**: Field rendering dispatch by `FieldKind`; no state.
- **Leaks**: Imports `RowDraft` type from `useRowDetailsDraft` — tight coupling between form and specific hook.

### `RowDetailsView.tsx`

- **Purpose**: Read-only display of a row's detail passport.
- **Owns**: Field-value resolution via `FIELD_RESOLVERS` map.
- **Leaks**: Hardcoded layout for `category`, `detailText`, `who`, `action` (same as `PRIMARY_FIELDS`) **separately from** `EXTRA_FIELDS`. Adding a primary field requires editing both `extra-fields.ts` and `RowDetailsView`'s JSX.

### `useRowDetailsDraft.ts`

- **Purpose**: Manages edit-draft state (init, mutate, reset on row change) for RowDetailsPanel.
- **Owns**: `editing` boolean, `draft: Partial<Row>`, field setter.
- **Leaks**: `DEFAULT_PERIODICITY`/`DEFAULT_COMPLEXITY` are business defaults belonging in the domain model, not the UI draft hook.

### `extra-fields.ts`

- **Purpose**: Schema registry that drives both edit-form rendering and view's completeness counter.
- **Owns**: Field configs (key, label, kind, options/typeCategory), `countFilled` utility.
- **Leaks**: The split between `PRIMARY_FIELDS` (edit-only) and `EXTRA_FIELDS` (both modes) is opaque — reader doesn't know without reading `RowDetailsView` that primary fields have a separate hardcoded view block.

### `AddItemForm.tsx`

- **Purpose**: Two-step form for adding 1-2 new detail rows, with optional quick-link after save.
- **Owns**: RHF form instance, `activeStep` tab state, `lastSavedId`, save-gate (`canSave`), per-category count checks.
- **Leaks**: Knows `onSaveSingle` returns a `string` (new row id) — but `useDetailActions.addRow` always returns `""`. Interface contract silently violated. Computes `s1Count`/`s2Count` from `allRows`, knowing the grid's grouping rule.

### `StepTabBody.tsx`

- **Purpose**: Scrollable field list for one step in AddItemForm.
- **Owns**: `whoOptions` filtering from `typesAll` (`WHO_PERFORMS_ACTION` category — was a hardcoded string, **now `Category.WHO_PERFORMS_ACTION`**).
- **Leaks**: Domain category was a string literal in a UI component (fixed). Otherwise displays only.

### `StepTab.tsx`

- **Purpose**: Active/inactive visual tab pill for step switching.
- **Owns**: Variant lookup; purely display.
- **Leaks**: Receives `activeStep` to compute its own variant — must know about the sibling tab's state to style itself. A simpler `isActive: boolean` prop would remove this.

### `FunctionFormPanel.tsx`

- **Purpose**: Collapsible create/edit form panel for a FtsFunction; orchestrates dict loading, available-name filtering, form lifecycle.
- **Owns**: Three dictionary queries, alive-list query, available-names memo, `firstFieldRef`, expand/discard confirm logic, focus-on-expand effect.
- **Leaks**: Computes `availableFunctionNames` by filtering taken name IDs — business logic depending on the API's 409-duplicate rule, lives in a UI panel rather than a hook or domain helper.

### `FunctionFormFields.tsx`

- **Purpose**: 9-field grid (4 type selects + 4 user selects + DTI multi-select) shared by create/edit modes.
- **Owns**: `TypeSelect` internal component with `SEARCHABLE_THRESHOLD` rendering branch.
- **Leaks**: `TypeSelectName` constants are `const`-as-const inside the file (not exported); `UserSelectName` defined in sibling `UserSelect.tsx`. No shared field-name registry — reader must check two files.

### `LinksPanel.tsx`

- **Purpose**: Displays links of the selected row, grouped by category, with navigate and remove actions.
- **Owns**: `collectLinkedItems` and `groupByCategory` — pure local transforms.
- **Leaks**: Accepts `rowMap: Map<string, Row>` from the modal (knows the modal's data structure). `allLinks` is the pre-filtered `selectedLinks` subset, but the prop name says `allLinks` — confusing.

### `LinkPicker.tsx`

- **Purpose**: Multi-select picker for creating new links from a source row to target rows.
- **Owns**: `kind`, `targetStep`, `search`, `checked` state; candidate filtering; `existingPairs` Set.
- **Leaks**: Issues its own `useConstantControllerGetTypesV1Query` for category colors despite the modal already holding `typesAll` (top-5 problem #4).

### `useDetailActions.ts`

- **Purpose**: Factory for all detail-mutating callbacks (add, update, remove row, create/remove links, saveDual).
- **Owns**: 5 RTK mutation instances, `runMutation` scaffold, all mutation orchestration.
- **Leaks**: `addRow` declared to return `string` but always returns `""` — type contract structurally broken.

### `useStepRowsModel.ts`

- **Purpose**: Derives all row/link/category projections from the API response in one hook.
- **Owns**: 8 independent `useMemo`s computing rows, links, rowMap, step buckets, index maps, category groups, link counts, color map.
- **Leaks**: `colorByCode` here is also independently rebuilt inside `LinkPicker`. Output surface is large — 13 fields — making it hard to know which caller needs which.

### `useSelectionLinks.ts`

- **Purpose**: Derives `linkedIds`, `selectedLinks`, `selectedRow` from current selection + full link/row data.
- **Owns**: 3 memos.
- **Leaks**: None notable. Clean.

### `useRowPresentation.ts`

- **Purpose**: Returns a stable function mapping any row to a `RowPresentation` enum based on current selection.
- **Owns**: 4-state priority logic: selected > linked > dimmed > normal.
- **Leaks**: None. Clean.

### `useRightTabConfig.ts`

- **Purpose**: Produces a `RightTabDef[]` array pairing each tab's metadata with a body render function.
- **Owns**: Tab disabled logic (`LINKER` disabled when no row selected).
- **Leaks**: All four `render*` functions are closures from `DetailizationModal` — the hook itself doesn't own content, making it a thin config-building wrapper of questionable value (could be a plain `useMemo` in the modal).

### `useFunctionForm.ts`

- **Purpose**: RHF + zod form for create/edit FtsFunction with populate-on-edit, duplicate-name detection, create/update/DTI-sync mutations.
- **Owns**: Form instance, collision query, mode-switch reset, edit-populate effect, `submitCreate`, `submitUpdate`, audit metadata.
- **Leaks**: Imports `FunctionFormPanelMode` from the component layer (`src/components/...`) — entity-layer hook depending on component-layer type is an **inverted dependency**. Also accesses `form.formState.defaultValues` inside `submitUpdate` to compute DTI diff — caller must never reset between mount and save (non-obvious constraint).

### `detail-resolvers.ts`

- **Purpose**: Pure functions to convert UI `DetailInput` → `CreateFtsFunctionDetailDto`, and to merge `Row` + partial updates into `DetailInput`.
- **Owns**: All code→id resolution; the `who` name→id lookup with silent free-text drop.
- **Leaks**: Silent-drop for free-text `who` is undocumented in the type — callers see `whoPerformsActionId: null` without knowing whether it was empty or unrecognised.

### `mappers.ts`

- **Purpose**: API DTO → UI model transforms (FunctionRecord, Row, Link) and the `ConstantsLookup` builder.
- **Owns**: All narrowing helpers (`asStep`, `asCategory`, etc.) and link deduplication via `seen` Set.
- **Leaks**: `buildConstantsLookup` builds a full lookup including `usersById` and `colorByCode`, but several call sites only need `typesById`. Function not split by concern → callers always over-compute.

---

## Trace A — "Save a detail row" (RowDetailsPanel Save button)

| #   | File : function                                           | What happens                                                              | Non-obvious jump?                                                                         |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `RowDetailsEdit.tsx` Save button `onClick`                | Calls `onSave` prop                                                       | –                                                                                         |
| 2   | `RowDetailsPanel.tsx` `handleSave`                        | Calls `onUpdateRow(row.id, draft)` then `finishEdit()`                    | ⚠️ Reader must know `onUpdateRow` comes from `useDetailActions` — prop name gives no hint |
| 3   | `DetailizationModal.tsx` render-prop closure              | `onUpdateRow={actions.updateRow}` wired at modal level                    | ⚠️ `actions` comes from `useDetailActions`, not visible from RowDetailsPanel              |
| 4   | `useDetailActions.ts` `updateRow`                         | `buildDetailInputFromRow(existing, updates)` then `resolveDetailDto(...)` | ⚠️ Requires knowing `rowMap` was passed at modal construction time                        |
| 5   | `detail-resolvers.ts` `buildDetailInputFromRow`           | Merges existing + partial updates into `DetailInput`                      | Clean                                                                                     |
| 6   | `detail-resolvers.ts` `resolveDetailDto`                  | Looks up enum codes → FK ids; returns `null` if any dict id is missing    | ⚠️ Returns `null` on missing dicts (not an error); caller must handle separately          |
| 7   | `mappers.ts` `findTypeIdByCode`                           | Linear scan of `typesAll` by `.code`                                      | ⚠️ `typesAll` is unfiltered global dict passed all the way from modal                     |
| 8   | `useDetailActions.ts` `runMutation` → `updateDetail(...)` | RTK mutation; on success `showSnackbar`                                   | Clean                                                                                     |
| 9   | RTK cache invalidation                                    | `getByIdV1Query` refetches; `useStepRowsModel` recomputes                 | ⚠️ Refetch is automatic via RTK tag invalidation; no tag visible in this file             |

**6 non-obvious jumps in 9 steps for one button click.**

---

## Trace B — "Add a function (create)"

| #   | File : function                                      | What happens                                                                          | Non-obvious jump?                                                                                         |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | `FunctionFormFields.tsx` form `onSubmit`             | Native form submit bubbles                                                            | –                                                                                                         |
| 2   | `FunctionFormPanel.tsx` `<form onSubmit={onSubmit}>` | `onSubmit` is `form.handleSubmit(submitCreate / submitUpdate)` from `useFunctionForm` | ⚠️ `onSubmit` not defined in panel, returned by hook                                                      |
| 3   | `useFunctionForm.ts` `onSubmit` (RHF `handleSubmit`) | RHF validates against `functionFormSchema`; on pass calls `submitCreate`              | ⚠️ Zod schema in `lib/function-form-schema.ts`, never imported by panel                                   |
| 4   | `useFunctionForm.ts` `submitCreate`                  | `buildFunctionDto(values)` then `createFn({createFtsFunctionDto})`                    | ⚠️ `buildFunctionDto` in `lib/function-form.ts`, separate from schema file                                |
| 5   | `useFunctionForm.ts` `batchAttachDtis` (conditional) | If DTIs selected, fires batch-attach mutation                                         | ⚠️ Only when `values.strategyProjectIds.length > 0`, easy to miss                                         |
| 6   | `useFunctionForm.ts` `reset(EMPTY_FUNCTION_FORM)`    | Resets form; also resets `isDirty` baseline (gates discard dialog)                    | ⚠️ Side effect on dirty state                                                                             |
| 7   | `useFunctionForm.ts` `onCreated?.(created.id)`       | Callback to parent panel prop                                                         | ⚠️ Caller side-effects (collapse panel, select new row) live in page-level component, invisible from here |

---

## Trace C — "Add a row via Add tab"

| #   | File : function                                       | What happens                                                                         | Non-obvious jump?                                                                                      |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 1   | `AddItemForm.tsx` `onSubmit`                          | `e.preventDefault()`; `getValues()` snapshot; recomputes save gate                   | ⚠️ Bypasses `handleSubmit` deliberately — reason in a comment                                          |
| 2   | `AddItemForm.tsx` branch on `canS1 && canS2`          | Either `onSaveDual(...)` or `onSaveSingle(...)`                                      | ⚠️ `fieldsToData` in `lib/schema.ts` (4th file)                                                        |
| 3   | `DetailizationModal.tsx` render-prop closure          | `onSaveSingle={actions.addRow}` etc.                                                 | ⚠️ `actions` from `useDetailActions`; wiring only visible at modal                                     |
| 4   | `useDetailActions.ts` `addRow`                        | `resolveDetailDto(item, typesAll)` then `runMutation(async () => createDetail(...))` | ⚠️ `addRow` returns `""` synchronously — actual id only available inside async closure, never returned |
| 5   | `AddItemForm.tsx` `setLastSavedId(onSaveSingle(...))` | Stores `""` as `lastSavedId` — QuickLink button never appears                        | 🚨 **CRITICAL bug** — `string` return contract broken                                                  |
| 6   | `detail-resolvers.ts` `resolveDetailDto`              | Code → id lookup (same as Trace A 6-7)                                               | Same null-on-missing-dicts behavior                                                                    |
| 7   | RTK mutation fires; `showSnackbar`                    | Same as Trace A                                                                      | –                                                                                                      |

---

## Bottom line

Reading any single file in this codebase explains 70% of _what_ it does. The remaining 30% — _how it's wired into the rest_ — requires reading 5–10 more files and reverse-engineering implicit contracts. **Three of the top-5 fixes are about killing render-prop closures and ad-hoc cross-component coupling.** Every single trace has multiple "wait, where does this come from?" moments — that's the user's "split logic" pain in concrete form.
