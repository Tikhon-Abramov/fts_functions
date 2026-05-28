# Audit: `FunctionFormPanel.tsx`

File: `frontend/src/components/FunctionFormPanel.tsx` (791 LOC). Read-only review; focus on RHF + zod migration.

## 1. Summary

- **Rating: 2 / 5** — the biggest single-file complexity hotspot in the form layer.
- **Top 3 issues:**
  1. Manual form state + manual dirty detection + manual validity + bespoke reset/populate effects — the canonical RHF use-case left unsolved.
  2. One 790-line JSX blob mixes header, 9-field grid, DTI chips, action bar, both modes. No sub-components.
  3. Four ad-hoc role-based `useMemo` user filters (L105–139) and six duplicated `useConstantControllerGetTypesV1Query` calls (L80–103).
- **LOC:** now **791**. Target in this file: **~260–300**; ~200 LOC redistributed to extracted pieces.

## 2. Classes present (1–17)

| #   | Pattern                  | Present?     | Evidence                                                     |
| --- | ------------------------ | ------------ | ------------------------------------------------------------ |
| 1   | Typed props              | Yes          | L53–61                                                       |
| 2   | Single-responsibility    | **No**       | Header+form+DTI+actions+2 modes                              |
| 3   | Controlled MUI inputs    | Yes          | every `Select value={form.x}`                                |
| 4   | Central form schema      | Partial      | `function-form.ts`, but no zod                               |
| 5   | Dirty in lib             | Partial      | lib used L190 but also re-implemented as JSON.stringify L186 |
| 6   | Declarative validation   | **No**       | `isFunctionFormValid` returns only boolean                   |
| 7   | react-hook-form          | **No**       | manual `useState` + curried `handleSelectChange` L217        |
| 8   | Zod resolver             | **No**       | —                                                            |
| 9   | `useDictionary` dedup    | **No**       | 6 raw dictionary queries L80–99                              |
| 10  | `rtkErrorMiddleware`     | Partial      | create relies on it; update swallows to `console.error` L301 |
| 11  | Snackbar on success      | Inconsistent | only edit path (L298)                                        |
| 12  | Focus management         | Yes          | L204–215 (DOM query)                                         |
| 13  | Confirm-before-destroy   | Yes          | L196, L240 (duplicated `window.confirm`)                     |
| 14  | testids                  | Yes          | throughout                                                   |
| 15  | Theme tokens             | Yes          | consistent                                                   |
| 16  | Role/branch filter hook  | **No**       | 4 inline memos L105–139                                      |
| 17  | Sub-component extraction | **No**       | none                                                         |

## 3. Design findings

### Manual state vs RHF — pain points

1. `useState<FormFields>` + second `initialSnapshot` state powering dirty (L153–155).
2. `handleSelectChange(field)` curried factory (L217) called at 9 sites.
3. Separate `handleMultiSelectChange` with string-split edge case (L224).
4. Two parallel dirty paths: `hasUnsavedEdits` (JSON.stringify, L184) **and** `isDirty` (library, L189). Can disagree (e.g. array order of `strategyProjectIds`) — subtle UX bug.
5. Validity is opaque boolean (L254); users see only a disabled button, no field-level feedback.
6. Reset flow has three paths: `handleClear` (L235), `handleCloseEdit` (L239), mode-switch effect (L164). RHF `reset(values)` collapses all three.
7. Populate-from-server effect (L173–182) with id-race guard — RHF `reset(populated)` eliminates it.
8. No `isSubmitting` equivalent — `submitting` derived from two RTK mutation states (L157).

### Mode switch (create vs edit) — entangled

`isEdit` branches 15+ times: JSX actions (L689–783), effects (L164, 173, 204), submit (L314). Preferred: extract `<FunctionFormFields>`; keep thin `<CreatePanel>` / `<EditPanel>` containers.

### Dirty detection — leftover ad-hoc

Yes: L184–187 computes `hasUnsavedEdits` with `JSON.stringify` **in parallel** to `isFunctionFormDirty` (L190). `hasUnsavedEdits` drives confirm modals; `isDirty` drives Save button. Kill `hasUnsavedEdits`; use the lib helper everywhere.

### Error handling — per field

None. No `<FormHelperText error>`, no red outlines. Users cannot tell which field is blocking submit.

### DTI add-only semantic

Documented in TODO (L543–548) but **not surfaced in UI**. Chips (L562–576) look deletable but silently aren't in edit mode. Needs helper-text or chips without close icons in edit mode.

### Six dictionary queries

L80–103 are near-identical, distinguished only by `Category`. A `useDictionary()` returning `{ centralizations, functionNames, markers, competencyCenters, dtis, users }` collapses ~24 lines to one call.

### User dropdowns filtered by role — scattered

L105–139: four `useMemo`s filter `usersAll` by `ftsBranchType` × (role | position). Replace with `useUsersBySlot(users, slot)` driven by a single predicate table.

### Submit → snackbar → middleware

Inconsistent:

- `handleCreate` (L256–271): no try/catch, no success snackbar, middleware surfaces errors.
- `handleUpdate` (L273–312): try/catch swallows to `console.error` — **blocks middleware**; also eats partial-success DTI-attach failures silently.
- Snackbar on success only on update (L298).

Fix: remove try/catch from update, add success snackbar to create.

## 4. RHF + zod migration plan

### Zod schema (separate file)

```ts
export const functionFormSchema = z.object({
  ftsFunctionNameId: z.string().min(1, "Выберите наименование"),
  ftsFunctionMarkerId: z.string().min(1, "Выберите маркер"),
  ftsCentralizationId: z.string().min(1),
  competencyCenterId: z.string().min(1),
  curatorCentralOfficeId: z.string().min(1),
  departmentHeadCentralOfficeId: z.string().min(1),
  managerInterregionalInspectionId: z.string().min(1),
  departmentHeadInterregionalInspectionId: z.string().min(1),
  strategyProjectIds: z.array(z.string()).default([]),
});
export type FunctionFormValues = z.infer<typeof functionFormSchema>;
```

### `useForm` + populate

```ts
const form = useForm<FunctionFormValues>({
  resolver: zodResolver(functionFormSchema),
  defaultValues: EMPTY_FUNCTION_FORM,
  mode: "onBlur",
});
const {
  control,
  handleSubmit,
  reset,
  formState: { isValid, isDirty, isSubmitting, errors },
} = form;

useEffect(() => {
  if (detailQuery.data) reset(populateFormFromDetail(detailQuery.data));
}, [detailQuery.data, reset]);
```

### Controller wiring (MUI Select)

```tsx
<Controller
  name="ftsFunctionNameId"
  control={control}
  render={({ field, fieldState }) => (
    <FormControl size="small" fullWidth error={!!fieldState.error}>
      <InputLabel>Наименование функции</InputLabel>
      <Select {...field} label="Наименование функции">
        {functionNames.map((m) => (
          <MenuItem key={m.id} value={String(m.id)}>
            {m.name}
          </MenuItem>
        ))}
      </Select>
      {fieldState.error && (
        <FormHelperText>{fieldState.error.message}</FormHelperText>
      )}
    </FormControl>
  )}
/>
```

### State replacements

- `isFunctionFormValid(form)` → `formState.isValid`
- `isFunctionFormDirty(form, snap)` → `formState.isDirty`
- `hasUnsavedEdits` → `formState.isDirty` (single source of truth)
- `initialSnapshot` state → **deleted** (RHF tracks baseline via `reset`)
- `submitting` → `isSubmitting || create/updateState.isLoading`

### Submit

```tsx
const onSubmit = handleSubmit(async (v) => (isEdit ? update(v) : create(v)));
```

### LOC delta

- Delete L153–192, L217–253, L254 ≈ **−85 LOC** state mgmt.
- Controller wrappers +2 LOC × 9 fields ≈ **+20 LOC**.
- Pre-extraction: **791 → ~720**.
- Post sub-component extraction: **~260–300** in this file.

## 5. Sub-component extraction

| Component                                                                           | Responsibility               | LOC est |
| ----------------------------------------------------------------------------------- | ---------------------------- | ------- |
| `<FunctionFormFields control dicts />`                                              | 9-field grid L430–686        | ~220    |
| `<FunctionFormHeader title icon showClose onClose onToggle expanded />`             | L350–420                     | ~60     |
| `<DtiMultiSelect control dtis mode />`                                              | L549–591, knows add-only     | ~60     |
| `<UserSelect control name label slot users />`                                      | collapses 4 Selects L593–685 | ~40     |
| `<FunctionFormActions isEdit valid isDirty submitting onSubmit onClear onCancel />` | L688–784                     | ~70     |

Host becomes an orchestrator: hooks + Header + Fields + Actions.

## 6. Custom hooks

- `useFunctionForm(mode, editingId)` — wraps `useForm` + detail query + create/update/attach + submit + confirm-on-dirty close; returns `{ form, onSubmit, onClear, onClose, loading, submitting }`. Moves ~100 LOC out.
- `useFunctionFormDictionary()` — aggregator for the 6 Category queries (use existing `useDictionary` if available).
- `useUsersBySlot(users, slot)` — one hook, one predicate table, replaces 4 memos (L105–139).

## 7. Prioritized actions (impact × effort)

| #   | Action                                                                          | Impact    | Effort  |
| --- | ------------------------------------------------------------------------------- | --------- | ------- |
| 1   | `useDictionary` + `useUsersBySlot`                                              | High      | Low     |
| 2   | Kill `hasUnsavedEdits`; `isFunctionFormDirty` everywhere                        | High      | Trivial |
| 3   | Remove `try/catch` from `handleUpdate`; add success snackbar to create          | High      | Low     |
| 4   | Migrate to RHF + zod (schema + Controllers)                                     | Very High | Medium  |
| 5   | Extract `<FunctionFormFields>`, `<FunctionFormActions>`, `<FunctionFormHeader>` | High      | Medium  |
| 6   | Extract `<UserSelect slot>` + `<DtiMultiSelect>`                                | Medium    | Low     |
| 7   | Surface DTI add-only semantic in UI                                             | Medium    | Trivial |
| 8   | Replace `window.confirm` with themed `<ConfirmDialog>`                          | Low       | Low     |
| 9   | Wrap in `<FormProvider>` for deep `useFormContext`                              | Medium    | Low     |

## 8. What's GOOD

- Lib extraction (`buildFunctionDto`, `populateFormFromDetail`, `isFunctionFormDirty/Valid`, `diffAddedDtis`) is solid — business logic isn't in this file.
- DTI additive-sync TODOs (L281–286, L543–548) are honest and clearly labelled.
- `skip: !isEdit || !expanded` (L150) avoids wasted fetches.
- Focus-on-expand (L204–215) is attentive UX.
- Consistent `data-testid` coverage.
- Mode-reset effect (L164) guards with `prevModeRef`.
- Theme-tokenised styling (`c.*`) — no hardcoded colours.
- Create path `.unwrap()`s correctly so global middleware surfaces errors.
