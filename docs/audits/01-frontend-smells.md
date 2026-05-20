# Audit 01 — Frontend Smells (`apps/web`)

> Strict line-by-line audit. Bar: anything not obvious to a new joiner reading the file is a finding.

## Critical (will cause user-visible bugs)

### C1 — Misleading defaults silently mutate empty rows on edit-open

**File**: `apps/web/src/components/RowDetailsPanel/hooks/useRowDetailsDraft.ts:16-17`

`periodicity: row.periodicity || DEFAULT_PERIODICITY` and `complexity: row.complexity || DEFAULT_COMPLEXITY` — when a row has no periodicity/complexity, opening the edit panel immediately seeds the draft with `"DAILY"` / `"MIDDLE"`. Clicking Save writes those phantom values to the DB without the user ever touching the fields.

**Fix**: use `row.periodicity ?? ""` and `row.complexity ?? ""` so the draft stays empty on empty rows. Update the resolver to accept empty-string as null.

### C2 — `AddItemForm.emptyStep()` pre-fills `KEEP / DAILY / MIDDLE` as defaults

**File**: `apps/web/src/components/AddItemForm/lib/schema.ts:55-64`

`actionLabel: FtsFunctionActionType.KEEP`, `periodicity: FtsFunctionExecutionFrequency.DAILY`, `complexity: FtsFunctionComplexity.MIDDLE` are baked into form defaults; every new row created via AddItemForm silently writes those enum values even if the user never selects them.

**Fix**: default those three fields to `""` and make the zod schema accept `""` for those optional fields, matching the `|| ""` pattern used elsewhere.

### C3 — `runMutation` silently swallows all errors with no user feedback

**File**: `apps/web/src/entities/fts-function/hooks/detail-modal/useDetailActions.ts:87-95`

```ts
const runMutation = useCallback((work) => {
  void (async () => {
    try {
      await work();
    } catch {
      /* RTK middleware reports failures globally */
    }
  })();
}, []);
```

The `catch {}` is empty. The comment claims "RTK middleware reports failures globally" — but `.unwrap()` throws inside an `async IIFE` never reach Redux middleware; it is caught here and dropped. Any network error on `addRow`/`updateRow`/`removeRow`/`createLinks`/`saveDual` silently disappears — the user sees a success snackbar in the next line.

**Fix**: dispatch a generic error snackbar in the catch block at minimum; ideally surface field-level errors when the response shape carries them.

### C4 — `addRow` always returns `""` — `quickLink` after add never fires

**File**: `apps/web/src/entities/fts-function/hooks/detail-modal/useDetailActions.ts:121-124` (caller `apps/web/src/components/AddItemForm/AddItemForm.tsx:160`)

`addRow` is typed `(...) => string`; caller does `setLastSavedId(onSaveSingle(...))`. The mutation is async — `addRow` returns `""` synchronously before the mutation completes — `lastSavedId` is always `""`, so the QuickLink button never appears after saving a single row.

**Fix**: change to `addRow: (...) => Promise<string>`; AddItemForm awaits.

### C5 — `FtsFunctionExecutionFrequency` i18n map missing values

**File**: `apps/web/src/entities/fts-function/model/fts-function-execution-frequency.ts:16-22`

`FTS_FUNCTION_EXECUTION_FREQUENCY_LABEL` only maps `DAILY`, `WEEKLY`, `MONTHLY` — but `PERIODICITIES = Object.values(FtsFunctionExecutionFrequency)`. If the shared enum has `BY_EVENT`/`ONCE` (the DB does!), those rows render as `t(undefined)` — empty string.

**Fix**: kill the entire `*_LABEL` map by sourcing labels from `Type.name` (DB-driven, same pattern as `who`).

---

## High (silent drift / hard-to-debug)

### H1 — `EXTRA_FIELD_KEYS` in `constants.ts` is dead/stale

**File**: `apps/web/src/entities/fts-function/constants.ts:60-68`

Lists `who` as an entry, but `who` was moved to `PRIMARY_FIELDS` in `extra-fields.ts`. No component imports `EXTRA_FIELD_KEYS` anymore.

**Fix**: delete.

### H2 — 5 `*_LABEL` i18n maps duplicate `Type.name` (the same bug we just fixed for `who`)

**Files**:

- `model/fts-function-complexity.ts`
- `model/fts-function-execution-frequency.ts`
- `model/fts-function-category.ts`
- `model/fts-function-action-type.ts`
- `model/fts-function-relation-type.ts`

Each `*_LABEL` map duplicates a column already stored in DB `Type.name`. Admin SQL UPDATE is invisible to the form.

**Fix**: migrate each to DB-driven lookup, exactly the pattern used for `WHO_PERFORMS_ACTION`. Delete each `*_LABEL` map and the corresponding i18n entries.

### H3 — Free-text `who` silently drops to `null` without user feedback

**File**: `apps/web/src/entities/fts-function/api/detail-resolvers.ts:83-85`

When the user types a `who` value not in the `WHO_PERFORMS_ACTION` type list, the match silently fails and `whoPerformsActionId = null` is sent. Comment literally says "drop silently."

**Fix**: surface a warning snackbar OR persist as a free-text column OR make the field a strict select (no free-text input).

### H4 — `saveDual` does not roll back step-1 if step-2 fails

**File**: `apps/web/src/entities/fts-function/hooks/detail-modal/useDetailActions.ts:244-262`

`s1` succeeds → `s2` throws → outer `catch {}` swallows → `s1` persisted with no `s2` and no link. Orphan row, no user feedback.

**Fix**: catch and delete `s1` on failure; OR surface failure explicitly so the user can retry.

### H5 — `Promise.allSettled` results never inspected

**File**: `apps/web/src/entities/fts-function/hooks/form/useFunctionForm.ts:223`

`Promise.allSettled([attachPromise, ...detachPromises])` ignores returned results entirely. Rejected attach/detach silently looks like success.

**Fix**: inspect settled results, dispatch error snackbar for each `rejected`.

---

## Medium (confusing / requires context)

### M1 — "Is row submittable" logic is split across 3 files

**Files**:

- `AddItemForm.tsx:120-125` (canSave)
- `AddItemForm/lib/schema.ts:68-73` (isStepFilled)
- `useDetailActions.ts:104-109` (resolveDetailDto null-check)

Three independent gates evaluated independently. New joiner cannot find single source.

**Fix**: consolidate submit-gate into `isStepFilled` + `fieldsToData`; resolver trusts validated input.

### M2 — Cryptic "Class 26" comments

**Files**: `RowDetailsPanel.tsx:54`, `RowDetailsEdit.tsx:160`, `RowDetailsView.tsx:223`

Reference a private design-doc number meaningful only to the original author.

**Fix**: replace with a one-line rationale, e.g. `// inline helpers receive theme/t as props instead of calling hooks (avoids re-renders)`.

### M3 — `actionLabel` union redeclared in 3 places

**Files**: `detail-resolvers.ts:26`, `useDetailActions.ts:39`, `AddItemForm.tsx:43`

The same `FtsFunctionActionType | ""` union is declared independently each time.

**Fix**: define `ActionLabelValue = FtsFunctionActionType | ""` in the model, import once.

### M4 — `countFilled` mislabels the chip badge

**Files**: `extra-fields.ts:158-163`, `RowDetailsView.tsx:121`

Chip displays `filledCount / EXTRA_FIELDS.length` (6 fields). The passport also includes PRIMARY_FIELDS, but those aren't counted.

**Fix**: count all fields, OR rename the badge to "Extra fields filled" so the math matches the label.

### M5 — `LinkPicker` fires its own `useConstantControllerGetTypesV1Query`

**File**: `apps/web/src/components/LinkPicker/LinkPicker.tsx`

Every sibling component receives `typesAll` from the modal as a prop. LinkPicker is the only one with a redundant internal query — hidden network round-trip.

**Fix**: accept `typesAll` as a prop; delete the internal query.

### M6 — `useStepRowsModel` exports 13 fields; not every consumer needs each

**File**: `apps/web/src/entities/fts-function/hooks/detail-modal/useStepRowsModel.ts`

Hook returns: `rows`, `links`, `rowMap`, `step1Count`, `step2Count`, `step1ByCategory`, `step2ByCategory`, `step1IndexMap`, `step2IndexMap`, `linkCountsPerCategory`, `colorByCode`, … huge surface area.

**Fix**: split into `useStepRowsModel` (rows/links) + `useStepRowsPresentation` (display indexes/counts/colors). One concern per hook.

---

## Low (cosmetic / delete candidates)

### L1 — Comment restating the obvious

**File**: `apps/web/src/entities/fts-function/api/mappers.ts:20-24` — block comment "Reverse lookups for dictionaries. Build lookup maps once per render pass." restates the function name.

**Fix**: delete.

### L2 — Comment that says nothing the function name doesn't

**File**: `apps/web/src/entities/fts-function/hooks/form/useFunctionForm.ts:224` — `// Re-baseline: a successful save makes the new values the dirty baseline.` precedes `reset(values)`.

**Fix**: delete.

### L3 — Dead `currentCount` prop on `StepTabBody`

**File**: `apps/web/src/components/AddItemForm/ui/StepTabBody.tsx:56-63` vs body destructure

`currentCount: number` declared in props but not destructured/used in the body.

**Fix**: remove from props type and call sites.
