import type { SubmitHandler, UseFormReturn } from "react-hook-form";

import { useCallback, useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FunctionFormPanelMode } from "src/components/FunctionFormPanel/lib/types";
import {
  buildFunctionDto,
  diffAddedDtis,
  diffRemovedDtis,
} from "src/entities/fts-function/lib/function-form";
import {
  EMPTY_FUNCTION_FORM,
  type FunctionFormFields,
  functionFormSchema,
} from "src/entities/fts-function/lib/function-form-schema";
import {
  useFtsFunctionControllerBatchAttachDtisV1V1Mutation,
  useFtsFunctionControllerCreateV1Mutation,
  useFtsFunctionControllerDetachDtiV1Mutation,
  useFtsFunctionControllerGetByIdV1Query,
  useFtsFunctionControllerListV1Query,
  useFtsFunctionControllerUpdateV1Mutation,
} from "src/shared/api/ftsFunctionsApi";
import { SnackbarSeverity, useSnackbar } from "src/shared/ui/snackbar";

export type UseFunctionFormArgs = {
  mode: FunctionFormPanelMode;
  editingFunctionId: number | undefined;
  expanded: boolean;
  onCreated?: ((newId: number) => void) | undefined;
  onSaved?: ((id: number) => void) | undefined;
};

export type FunctionFormAudit = {
  createdAt: string;
  updatedAt: string;
};

export type UseFunctionFormResult = {
  form: UseFormReturn<FunctionFormFields>;
  onSubmit: ReturnType<UseFormReturn<FunctionFormFields>["handleSubmit"]>;
  submitting: boolean;
  loading: boolean;
  isEdit: boolean;
  audit: FunctionFormAudit | null;
};

/**
 * Wraps RHF + zod for the FunctionFormPanel. Encapsulates:
 *  - form instance with zod resolver and EMPTY default values
 *  - edit-mode populate effect (replaces ad-hoc populateFormFromDetail + snapshot)
 *  - create/update mutations and DTI batch-attach
 *  - mode-switch reset (RHF `reset` collapses three previous reset paths)
 *
 * Errors are NOT caught: RHF rejects naturally, rtkErrorMiddleware translates
 * RTK rejections to a global snackbar. Success on update emits a local snackbar.
 */
export function useFunctionForm({
  mode,
  editingFunctionId,
  expanded,
  onCreated,
  onSaved,
}: UseFunctionFormArgs): UseFunctionFormResult {
  const { showMessage } = useSnackbar();

  const isEdit =
    mode === FunctionFormPanelMode.EDIT && editingFunctionId != null;

  const [createFn, createState] = useFtsFunctionControllerCreateV1Mutation();
  const [updateFn, updateState] = useFtsFunctionControllerUpdateV1Mutation();
  const [batchAttachDtis] =
    useFtsFunctionControllerBatchAttachDtisV1V1Mutation();
  const [detachDti] = useFtsFunctionControllerDetachDtiV1Mutation();

  const detailQuery = useFtsFunctionControllerGetByIdV1Query(
    { id: editingFunctionId ?? 0 },
    { skip: !isEdit || !expanded },
  );

  const form = useForm<FunctionFormFields>({
    // Cast: knip transitively pulls zod@4; web's direct zod@3 collides in the
    // type system but resolves correctly at runtime. See docs/known-limitations.
    resolver: zodResolver(functionFormSchema as never),
    mode: "onChange",
    defaultValues: EMPTY_FUNCTION_FORM,
  });

  const { reset, setError, clearErrors } = form;
  const prevModeRef = useRef<FunctionFormPanelMode>(mode);

  // Crutchy uniqueness guard: when the user picks a function name (FK), peek
  // the list endpoint with that nameId filter (limit=1, idNot=editingId in
  // EDIT mode so the row being edited doesn't collide with itself). If the
  // server returns a hit we inject an RHF field-level error — that flips
  // `formState.isValid` to false (gating the Save button) AND surfaces the
  // message via the existing `helperText={fieldState.error?.message}` wiring,
  // so no new UI plumbing is needed. Backend 409 (FUNCTION_NAME_DUPLICATE)
  // is the safety net for races and rows not yet loaded into this query.
  const watchedNameId = useWatch({
    control: form.control,
    name: "ftsFunctionNameId",
  });
  const parsedNameId =
    watchedNameId && watchedNameId !== "" ? Number(watchedNameId) : NaN;
  const collisionQuery = useFtsFunctionControllerListV1Query(
    {
      ftsFunctionNameIds: [parsedNameId],
      ...(isEdit && editingFunctionId != null
        ? { idNot: editingFunctionId }
        : {}),
    },
    { skip: !Number.isFinite(parsedNameId) || !expanded },
  );
  const nameTaken = (collisionQuery.data?.items?.length ?? 0) > 0;

  useEffect(() => {
    if (nameTaken) {
      setError("ftsFunctionNameId", {
        type: "duplicate",
        message: "Функция с таким названием уже существует",
      });
    } else {
      clearErrors("ftsFunctionNameId");
    }
  }, [nameTaken, setError, clearErrors]);

  // Mode switch: reset baseline when transitioning into create mode.
  useEffect(() => {
    if (
      mode === FunctionFormPanelMode.CREATE &&
      prevModeRef.current !== FunctionFormPanelMode.CREATE
    ) {
      reset(EMPTY_FUNCTION_FORM);
    }
    prevModeRef.current = mode;
  }, [mode, reset]);

  // Edit mode: populate the form from the detail response. RHF `reset` updates
  // both values AND the dirty baseline — replacing the old `initialSnapshot`
  // state and `populateFormFromDetail` helper.
  useEffect(() => {
    if (!isEdit) return;
    const data = detailQuery.data;
    if (!data) return;
    if (editingFunctionId != null && data.id !== editingFunctionId) return;
    reset({
      ftsFunctionNameId: String(data.ftsFunctionNameId ?? ""),
      ftsFunctionMarkerId: String(data.ftsFunctionMarkerId ?? ""),
      ftsCentralizationId: String(data.ftsCentralizationId ?? ""),
      competencyCenterId: String(data.competencyCenterId ?? ""),
      curatorCentralOfficeId: String(data.curatorCentralOfficeId ?? ""),
      departmentHeadCentralOfficeId: String(
        data.departmentHeadCentralOfficeId ?? "",
      ),
      managerInterregionalInspectionId: String(
        data.managerInterregionalInspectionId ?? "",
      ),
      departmentHeadInterregionalInspectionId: String(
        data.departmentHeadInterregionalInspectionId ?? "",
      ),
      strategyProjectIds: (data.dtis ?? []).map((d) => String(d.dtiId)),
    });
  }, [isEdit, detailQuery.data, editingFunctionId, reset]);

  const submitCreate: SubmitHandler<FunctionFormFields> = useCallback(
    async (values) => {
      const created = await createFn({
        createFtsFunctionDto: buildFunctionDto(values),
      }).unwrap();
      if (values.strategyProjectIds.length > 0) {
        await batchAttachDtis({
          id: created.id,
          batchAttachDtisRequestDto: {
            dtiIds: values.strategyProjectIds.map((v) => Number(v)),
          },
        }).unwrap();
      }
      reset(EMPTY_FUNCTION_FORM);
      showMessage("Изменения сохранены", SnackbarSeverity.SUCCESS);
      onCreated?.(created.id);
    },
    [createFn, batchAttachDtis, reset, showMessage, onCreated],
  );

  const submitUpdate: SubmitHandler<FunctionFormFields> = useCallback(
    async (values) => {
      if (editingFunctionId == null) return;
      await updateFn({
        id: editingFunctionId,
        updateFtsFunctionDto: buildFunctionDto(values),
      }).unwrap();
      // Two-way DTI sync: attach any newly-added DTIs and detach any baseline
      // DTIs that were removed in the form. Detach calls run in parallel via
      // Promise.allSettled so a single failure doesn't block sibling detaches
      // OR the attach flow — rejections surface through `rtkErrorMiddleware`
      // as snackbars without unwinding the rest of the save.
      const baseline = form.formState.defaultValues?.strategyProjectIds ?? [];
      const baselineStrings = baseline.filter(
        (v): v is string => typeof v === "string",
      );
      const added = diffAddedDtis(baselineStrings, values.strategyProjectIds);
      const removed = diffRemovedDtis(
        baselineStrings,
        values.strategyProjectIds,
      );
      const attachPromise =
        added.length > 0
          ? batchAttachDtis({
              id: editingFunctionId,
              batchAttachDtisRequestDto: {
                dtiIds: added.map((v) => Number(v)),
              },
            }).unwrap()
          : Promise.resolve();
      const detachPromises = removed.map((dtiId) =>
        detachDti({ id: editingFunctionId, dtiId: Number(dtiId) }).unwrap(),
      );
      await Promise.allSettled([attachPromise, ...detachPromises]);
      // Re-baseline: a successful save makes the new values the dirty baseline.
      reset(values);
      showMessage("Изменения сохранены", SnackbarSeverity.SUCCESS);
      onSaved?.(editingFunctionId);
    },
    [
      editingFunctionId,
      updateFn,
      batchAttachDtis,
      detachDti,
      form.formState.defaultValues,
      reset,
      showMessage,
      onSaved,
    ],
  );

  const onSubmit = form.handleSubmit(isEdit ? submitUpdate : submitCreate);

  const submitting = createState.isLoading || updateState.isLoading;
  const loading = isEdit && detailQuery.isLoading && !detailQuery.data;

  // Audit metadata for the form header in EDIT mode. The DTO currently only
  // surfaces createdAt/updatedAt; createdById/updatedById live in the DB
  // (`created_by_id` / `updated_by_id` on `users`-FK columns) but are not
  // yet on `FtsFunctionDetailedResponseDto`. Once the backend extends the
  // DTO the header redesign keeps just the timestamp — the user-name part
  // was dropped intentionally to fit the inline header layout.
  const audit =
    isEdit && detailQuery.data
      ? {
          createdAt: detailQuery.data.createdAt,
          updatedAt: detailQuery.data.updatedAt,
        }
      : null;

  return { form, onSubmit, submitting, loading, isEdit, audit };
}
