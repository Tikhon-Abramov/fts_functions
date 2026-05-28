# Row Panels — TSX Audit

Scope: `LinksPanel.tsx`, `RowDetailsPanel.tsx`, `AddItemForm.tsx` (all under `frontend/src/components/`).
Refs: `docs/patterns.md` (classes 1-17), agario `docs/guides/standards.md`. Read-only. 2026-04-24.

---

## File 1 — `LinksPanel.tsx` (253 LOC)

### Rating — 6/10

Tight for its size but violates the agario ".map() with 5+ lines of JSX → helper" rule hard. Logic is clean; presentation is a chain of deeply nested Boxes with a ~50-line inline `.map()` callback.

### Classes present

- **Class 1** (Russian): 52, 98, 118, 157, 185, 220-222.
- **Class 3** (inline `sx`): ~19 `sx` blocks, several 5+ lines (87, 89-107, 131-137, 165-172, 188-196, 200-209, 216-218, 232-237). The `textMuted+uppercase+letterSpacing 0.05em+0.6rem` caption triad repeats 3×.
- **Class 6** (multi-responsibility): 253 LOC doing empty-state, grouping, category headers, link rows — four concerns.
- **Class 7** (magic numbers): `width:4/height:14` (141-142), `fontSize:40` (50), `WebkitLineClamp:2` (207), every font-size literal.
- **Class 17** (inline business logic): 58-74 — `linkedItems` + `byCategory` partition is pure data logic; belongs in `entities/fts-function/lib/links-grouping.ts::groupLinksByCategory()`.
- **Class 14-adjacent**: `byCategory` is indexed by Russian display strings (67-71), not identity.

### Chain-of-elements (primary finding)

Lines 161-243: an 83-line `.map()` callback per link. Against agario's 5-line rule, 10× over budget. Inside the `ListItemButton`:

- `ListItemText.primary` = inline Box (177-213) wrapping a Chip (184-197) + clamped Typography (198-212)
- `ListItemText.secondary` = inline Typography (215-224)
- trailing `IconButton` with stopPropagation delete (226-241)

**Extract `<LinkRow>`** (helper below main, not exported; per standards §JSX Helpers):

```tsx
type LinkRowProps = {
  linkId: string;
  targetRow: Row;
  onNavigate: (id: string) => void;
  onRemoveLink: (linkId: string) => void;
};
function LinkRow({ linkId, targetRow, onNavigate, onRemoveLink }: LinkRowProps) { … }
```

Also extract `<CategoryGroup>` (128-247) — `{cat, items, color}` is its own unit. After both, main body becomes a linear ~25-line JSX reading like prose.

### Other design findings

- `byCategory` guard `if (!cc) return null` (126) is dead — `categoryColors` covers all three `CATEGORIES`.
- `linkBadgeBg`/`linkBadgeColor`/`linkBadgeBorder` tokens used only here → `<LinkBadgeChip />` shared sub-component.
- Empty state (37-56) → `<LinksPanelEmpty />`.
- `selectedRow.detailText` in header (110) is unclamped — long detail text shoves list off-screen.
- `onRemoveLink` has no confirm — destructive, no undo.

### LOC target after refactor

~100 LOC main + ~40 LinkRow + ~25 CategoryGroup + ~15 Empty ≈ ~180 total; main under 100.

---

## File 2 — `RowDetailsPanel.tsx` (574 LOC)

### Rating — 5/10

**Breaks the 300-LOC ceiling nearly 2×**. Two near-duplicate render branches (edit/view) sharing almost nothing. Biggest maintainability liability of the three.

### Classes present

- **Class 1** (Russian): 52, 62, 155, 257, 270, 375, 425, 453, 470, 492, 513, 524, 537, 562 — ~14 literals.
- **Class 3** (inline `sx`): `inputSx`/`selectSx`/`labelSx`/`menuSx` quartet (91-132) is **byte-identical** to `AddItemForm:159-200`. Canonical Class 3. Caption triad repeats at 137-143, 464-468, 484-490, 506-511, 530-535, 552-561.
- **Class 4** (manual form state): `editing` + `draft: Partial<Row>` (37-89). 8 fields spread-updated by hand — RHF collapses this.
- **Class 6**: 574 LOC ≈ 2× ceiling.
- **Class 7**: every font-size, `width:6/height:6` (408-409), `maxHeight:200` (124).
- **Class 9** (dictionary FKs as display strings): `row.periodicity || "Разово"` (71), `row.complexity || "Средняя"` (72).
- **Class 17** (inline logic): `filledCount` (221-224) → `entities/fts-function/lib/paspo rt.ts::countFilledExtras(row)`.

### Draft state — state machine smell? RHF fit?

`editing: boolean` + `draft: Partial<Row>` + three transition handlers + `useEffect` reset on `row?.id` = poor-man's two-state machine.

- **State-machine read**: effectively `Mode = VIEW | EDIT`. Per standards §Enum-Like should be `const Mode = { VIEW: "VIEW", EDIT: "EDIT" } as const`. Two states tolerate a boolean now, but LOADING/SAVING/ERROR are the obvious next states on async save.
- **RHF fit: strong.** Per Class 4 + standards §Forms ("forms with 2+ fields use react-hook-form"), this 7-field form is exactly the target:
  - `useForm<DraftRow>({ defaultValues: rowToDraft(row) })`
  - `useEffect(() => form.reset(rowToDraft(row)), [row?.id])` replaces 37-43 and 68-79.
  - `form.formState.isDirty` replaces `editing` (dirtiness IS edit mode).
  - `handleSubmit(onValid)` + `form.reset()` replace `handleSave`/`handleCancel`.
  - `<Controller>` collapses `renderEditSelect`/`renderEditTextField` to one-liners.

### View/edit toggle — cleanly separated?

**No.** Two sibling JSX trees (226-380, 382-572) duplicate the shell (flex-col, overflow-hidden, header/scroll/footer) with 0% content overlap. Clean split:

```
<PaspoShell>               // shared flex-column overflow shell
  header slot / body slot / footer slot
```

plus `<PaspoViewBody row/>` and `<PaspoEditForm row onSave onCancel/>` (RHF-backed). The 226-line ternary should not live in one file.

### Extra-field-labels config — good or over-engineered?

`EXTRA_FIELD_LABELS` drives the read loop (566-568) and the fill count (221-224). Textbook standards §DSL pattern. **Good.** Shortfall: edit side does NOT use it — 312-351 is six hand-written `renderEditSelect`/`renderEditTextField` calls. Extend config with `{ key, label, kind: 'text'|'select'|'multiline', options? }` so both read and edit loop over one array. That's the Class 15/DSL endpoint.

### Design findings (misc)

- `draft.who = ""` vs `row.who = undefined` — mismatched empty semantics (71 uses `|| ""`, mappers use `|| undefined`). RHF + zod would pin this.
- `useEffect` resets on `row?.id` but clicking away mid-edit silently loses data.
- `render*` helpers returning JSX inside the component (134-215) violate standards §JSX Helpers "don't store JSX in variables — use sub-components".
- Autocomplete inlined, Selects via helper, TextFields via helper — inconsistent abstraction levels.
- `stepLabel` ternary (217) → `STEP_LABELS` record.

### Sub-component / hook extractions

1. `<PaspoShell>` — the flex-column shell with header/body/footer slots.
2. `<PaspoViewBody row />` — 457-569, renders from `EXTRA_FIELD_LABELS`.
3. `<PaspoEditForm row onSave onCancel />` — RHF-backed edit branch.
4. `<FieldLabel>` — caption block ×7 (see Cross-file).
5. `<ReadField label value>` — 134-158 moved out.
6. `usePaspoDraft(row)` — if keeping manual state, encapsulates init/reset/save/cancel.

---

## File 3 — `AddItemForm.tsx` (567 LOC)

### Rating — 5/10

Same 300-LOC breach. Step-tab flow works but it's a 2-field-set form mashed into one component with duplicated sx and hardcoded Class-9 defaults. Mirrors the `FunctionFormPanel` issues from a prior audit — same RHF migration applies.

### Classes present

- **Class 1** (Russian): 47-57, 231, 351, 357-358, 378-380, 394, 434, 442, 453, 460, 467, 473, 479, 486, 514, 522, 539, 560 — ~20 literals.
- **Class 3**: `inputSx`/`selectSx`/`labelSx`/`menuSx` (159-200) **byte-identical** to `RowDetailsPanel:91-132`. Extracting once kills ~80 duplicated LOC.
- **Class 4**: 4 `useState`s + `isStepFilled` + `canSave` useMemo 3-way branch + manual `emptyStep`/`fieldsToData` translators — Class-4 shape exactly.
- **Class 6**: 567 LOC.
- **Class 7**: `height:16/18/200`, every font-size, raw `rgba(255,255,255,0.25)` and `0.5` (300, 304).
- **Class 9** (hardcoded defaults): 48-55 — `"Методология"`, `"Оставить"`, `"Разово"`, `"Средняя"`.
- **Class 17**: `countByStepCategory` (119-120), `fieldsToData` (86-99) are module-level (good) but belong in `entities/fts-function/lib/add-item.ts` for testability.

### Hardcoded Russian defaults (Class 9) — how should they come from dictionary?

Current (48-55) hardcodes `"Методология" / "Оставить" / "Разово" / "Средняя"`. Three progressive fixes — pick the furthest the project is ready for:

1. **Minimum**: add `DEFAULT_CATEGORY`/`DEFAULT_ACTION`/`DEFAULT_PERIODICITY`/`DEFAULT_COMPLEXITY` to `entities/fts-function/constants.ts`, typed from existing unions.
2. **Better**: `CATEGORIES[0]` / `ACTIONS[0]` / `PERIODICITIES[0]` / `COMPLEXITIES[0]` — ordering arrays "default first", one-file renames.
3. **Class-9 endpoint**: introduce `useDictionary(types)` (cited in Class 15) and do `byCategory[Category.FTS_...]?.[0]?.id`. Needs backend dictionary, but a shim hook reading from current constants unblocks call sites today.

Applies equally to `RowDetailsPanel:71-72`.

### Two-tab step1/step2 flow — state cleanly handled?

**Partially.** It works but has smells:

- `activeStep: 1 | 2` + derived 6-tuple (134-139) — should use `Step.ONE`/`Step.TWO` per standards §Enum-Like, and a Record-map `stepSlices[activeStep]` would collapse the tuple.
- Parallel `s1`/`s2` leaks everywhere (`s1Filled`/`s2Filled`/`s1LimitReached`/…). RHF nested form `{ step1, step2 }` collapses this — `form.formState.dirtyFields` replaces `isStepFilled`.
- `handleSave` silently picks single/dual (143-155) — a hidden state machine. Make it explicit:
  ```ts
  const SaveMode = { SINGLE_S1: ..., SINGLE_S2: ..., DUAL: ... } as const;
  const saveMode = computeSaveMode(s1Filled, s2Filled, limits);
  ```
  Then label, test-id, and dispatch all derive from one value (eliminates the `bothFilled ? ...` ternary at 537).
- `lastSavedId` cleared to `null` on dual save (145) — needs comment or reducer.

### RHF migration opportunity (same as FunctionFormPanel)

| Current                                 | RHF                                                             |
| --------------------------------------- | --------------------------------------------------------------- |
| `useState<StepFields>(emptyStep())` × 2 | `useForm<{step1:StepFields;step2:StepFields}>({defaultValues})` |
| `s1Filled`/`s2Filled`                   | `useWatch` or zod refine                                        |
| `canSave` useMemo                       | `formState.isValid` + zod `.refine(limits)`                     |
| `handleSave` spread logic               | `handleSubmit(onValid)` + `form.reset()`                        |
| `emptyStep()`                           | `defaultValues`                                                 |
| `fieldsToData`                          | zod transform on submit                                         |
| `renderSelect`/`renderTextField`        | `<Controller>` one-liners                                       |

Net: ~150 LOC deleted, dual-vs-single becomes a typed discriminated-union submit.

### Sub-component extraction

1. `<AddItemHeader />` — 340-353.
2. `<StepTabs s1Filled s2Filled active onChange />` — 355-360 + the `renderStepTab` helper (260-313, currently JSX-in-variable).
3. `<StepBody fields onChange limitWarning />` — 362-492, scrollable middle.
4. `<AddItemFooter bothFilled currentCount canSave saveLabel onSave lastSavedId onQuickLink />` — 494-563.
5. `addItemSchema.ts` + `addItemToRow.ts` in `entities/fts-function/lib/` — `fieldsToData`, `emptyStep`, `isStepFilled`, zod schema.

---

## Cross-file findings

### Shared patterns to extract

1. **sx quartet** `inputSx`/`selectSx`/`labelSx`/`menuSx` — byte-identical at `RowDetailsPanel:91-132` and `AddItemForm:159-200`. → `shared/ui/styles/form.ts`. Deletes ~80 LOC.
2. **FieldLabel triad** (`textDim+0.6rem+uppercase+letterSpacing 0.05em`) — 12 instances across all three files. → `<FieldLabel>`.
3. **Section-header caption** (`textSecondary+600+uppercase+0.65rem`) — 3+ copies. → `<SectionHeader>`.
4. **Category accent bar** (`LinksPanel:139-147`). → `<CategoryAccent cat size/>`.
5. **Save button** — `RowDetailsPanel:362-376` ≈ `AddItemForm:525-540`. → `<PrimarySaveButton>`.
6. **`WHO_OPTIONS` Autocomplete** — `RowDetailsPanel:286-311` ≈ `AddItemForm:410-439`. → `<WhoAutocomplete>`.
7. **Empty state** — `LinksPanel:37-56` ≈ `RowDetailsPanel:45-66`. → `<EmptyState icon text/>`.
8. **renderReadField** (`RowDetailsPanel:134-158`) → `<ReadField label value/>`.
9. **Step dot + label** (`RowDetailsPanel:405-426`) → `<StepBadge step/>` reused by `LinksPanel`.
10. **Filled-count chip** (`RowDetailsPanel:427-439`) → `<CountChip current total/>`.

### Shared files to create

- `shared/ui/form/{FieldLabel,ReadField,PrimarySaveButton,WhoAutocomplete}.tsx`
- `shared/ui/feedback/EmptyState.tsx`, `shared/ui/chips/{ActionChip,CategoryChip,CountChip,StepBadge}.tsx`
- `shared/ui/styles/form.ts`
- `entities/fts-function/lib/{links-grouping,paspo rt,add-item}.ts` (pure logic)
- `entities/fts-function/constants.ts` + `DEFAULT_CATEGORY/ACTION/PERIODICITY/COMPLEXITY`

---

## Prioritized actions (impact × effort)

| #   | Action                                                                                    | Impact | Effort  |
| --- | ----------------------------------------------------------------------------------------- | ------ | ------- |
| 1   | Extract `inputSx`/`selectSx`/`labelSx`/`menuSx` to `shared/ui/styles/form.ts`             | High   | Low     |
| 2   | Extract `<LinkRow>` + `<CategoryGroup>` from `LinksPanel`                                 | High   | Low     |
| 3   | Split `RowDetailsPanel` into `<PaspoShell>` + `<PaspoViewBody>` + `<PaspoEditForm>`       | High   | Med     |
| 4   | Move `emptyStep`/`fieldsToData`/`isStepFilled` to `entities/fts-function/lib/add-item.ts` | Med    | Low     |
| 5   | Class-9 fix — `DEFAULT_*` constants, then `useDictionary()` shim                          | Med    | Low→Med |
| 6   | Migrate `AddItemForm` to RHF with nested `{step1, step2}` schema                          | High   | High    |
| 7   | Migrate `RowDetailsPanel` draft to RHF (kills `editing` + `draft` + reset effect)         | Med    | Med     |
| 8   | Extend `EXTRA_FIELD_LABELS` with `kind`/`options` and drive edit fields from it           | Med    | Low     |
| 9   | Extract shared chip / label / empty-state sub-components                                  | Med    | Low     |
| 10  | i18n loader (Class 1) — ~50 Russian literals across these three files                     | Med    | High    |
| 11  | `Mode`/`Step`/`SaveMode` enum-like consts per standards §Enum-Like                        | Low    | Low     |

---

## What's GOOD

- Consistent `data-testid` everywhere — E2E hook discipline.
- Theme tokens throughout (`c.bgInput`, `c.borderMedium`); only two raw `rgba()` at `AddItemForm:300-305` break it.
- `EXTRA_FIELD_LABELS` as config-driven render (`RowDetailsPanel:566`) — textbook standards §DSL. Extend, don't remove.
- Type imports segregated with `import type` everywhere.
- Module-level pure helpers in `AddItemForm` (`emptyStep`, `isStepFilled`, `fieldsToData`) — correct ordering; just belong in entity lib.
- Clean `useMemo` deps in `AddItemForm:127-132` — no Class 5.
- Clean early-return empty states in `LinksPanel`/`RowDetailsPanel`.
- Props typed per component (though `interface` not `type` — minor drift).
- `NewRowData` exported from `AddItemForm` — decouples parent from internal shape.

---

## Summary

| File                  | LOC | Rating | Headline                                                                      |
| --------------------- | --- | ------ | ----------------------------------------------------------------------------- |
| `LinksPanel.tsx`      | 253 | 6/10   | Chain-of-elements in `.map()`; extract `<LinkRow>` + `<CategoryGroup>`.       |
| `RowDetailsPanel.tsx` | 574 | 5/10   | 2× LOC breach; view/edit branches should be separate components; RHF fit.     |
| `AddItemForm.tsx`     | 567 | 5/10   | LOC breach, Class-9 defaults, step flow wants RHF and explicit SaveMode enum. |

~1,394 LOC of components could reasonably drop to ~700 LOC + ~150 LOC new shared UI by executing actions #1-5 alone.
