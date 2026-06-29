import { useEffect, useMemo, useRef } from "react";
import { Box, Button, CircularProgress, Collapse, IconButton, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Add, Close, EditOutlined, ExpandLess, ExpandMore } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppDispatch, useAppSelector } from "../../store";
import { selectEditableFtsFunctionId, selectFtsFunctionFormOpen, setEditableFtsFunction, showSnackbar, toggleFtsFunctionFormOpen } from "../../store/uiSlice";
import { useFtsFunctionControllerCreateV1Mutation, useFtsFunctionControllerGetFtsFunctionByIdV1Query, useFtsFunctionControllerUpdateV1Mutation } from "../../store/ftsFunctionRegistry";
import { FtsFunctionFormSchema, type FtsFunctionFormData } from "./schema";
import { FormSelect } from "./FormSelect";
import { DtiMultiSelect } from "./DtiMultiSelect";
import { HeaderAudit } from "./HeaderAudit";
import type { GetColumnsProps } from "./columns";



const EMPTY_FORM: FtsFunctionFormData = {
  ftsFunctionNameId: Number.NaN,
  ftsFunctionMarkerId: Number.NaN,
  ftsCentralizationId: Number.NaN,
  competencyCenterId: Number.NaN,
  curatorCentralOfficeId: Number.NaN,
  departmentHeadCentralOfficeId: Number.NaN,
  managerInterregionalInspectionId: Number.NaN,
  departmentHeadInterregionalInspectionId: Number.NaN,
  dtiIds: [],
};


type FtsFunctionFormProps = {
  options: GetColumnsProps;
  usedFtsFunctionNameIds: Set<number>;
};


export function FtsFunctionForm({ options, usedFtsFunctionNameIds }: FtsFunctionFormProps) {
  const dispatch = useAppDispatch();
  const expanded = useAppSelector(selectFtsFunctionFormOpen);
  const editableFtsFunctionId = useAppSelector(selectEditableFtsFunctionId);
  const isEditing = editableFtsFunctionId !== null;

  const theme = useTheme();
  const c = theme.custom;

  const initialFormData = useRef<FtsFunctionFormData | null>(null);

  // ============ 1. Данные редактируемой функции ============
  const { data: ftsFunctionData, isFetching } = useFtsFunctionControllerGetFtsFunctionByIdV1Query(
    expanded && isEditing ? { id: String(editableFtsFunctionId) } : skipToken,
  );

  const ftsFunctionInfo = useMemo(() => ftsFunctionData?.data, [ftsFunctionData]);

  // ============ 2. Мутации ============
  const [createFtsFunction, { isLoading: isCreating }] = useFtsFunctionControllerCreateV1Mutation();
  const [updateFtsFunction, { isLoading: isUpdating }] = useFtsFunctionControllerUpdateV1Mutation();

  // ============ 3. Форма ============
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<FtsFunctionFormData>({
    resolver: zodResolver(FtsFunctionFormSchema),
    mode: "onChange",
    defaultValues: EMPTY_FORM,
  });

  const submitting = isSubmitting || isCreating || isUpdating;

  const selectedFtsFunctionNameId = watch("ftsFunctionNameId");

  // ============ 4. Сброс при открытии/закрытии и смене режима ============
  useEffect(() => {
    initialFormData.current = null;
    if (!expanded || !isEditing) {
      reset(EMPTY_FORM);
    }
  }, [expanded, isEditing, editableFtsFunctionId, reset]);


  // ============ 5. Загрузка данных при редактировании (однократно) ============
  useEffect(() => {
    if (!expanded || !isEditing) return;
    if (!ftsFunctionInfo || initialFormData.current) return;

    const values = {
      ftsFunctionNameId: ftsFunctionInfo.ftsFunctionName.id,
      ftsFunctionMarkerId: ftsFunctionInfo.ftsFunctionMarker.id,
      ftsCentralizationId: ftsFunctionInfo.ftsCentralization.id,
      competencyCenterId: ftsFunctionInfo.competencyCenter.id,
      curatorCentralOfficeId: ftsFunctionInfo.curatorCentralOffice.id,
      departmentHeadCentralOfficeId: ftsFunctionInfo.departmentHeadCentralOffice.id,
      managerInterregionalInspectionId: ftsFunctionInfo.managerInterregionalInspection.id,
      departmentHeadInterregionalInspectionId: ftsFunctionInfo.departmentHeadInterregionalInspection.id,
      dtiIds: ftsFunctionInfo.dtis.map((dti) => dti.type.id),
    };

    initialFormData.current = values;
    reset(values);
  }, [expanded, isEditing, ftsFunctionInfo, reset]);

  // ============ 6. Открытие/закрытие ============
  const handleToggle = () => dispatch(toggleFtsFunctionFormOpen());
  const handleCloseEdit = () => dispatch(setEditableFtsFunction(null));
  const handleClear = () => reset(EMPTY_FORM);

  const closeForm = () => {
    if (isEditing) {
      dispatch(setEditableFtsFunction(null));
    } else if (expanded) {
      dispatch(toggleFtsFunctionFormOpen());
    }
  };

  // ============ 7. Отправка формы ============
  const onSubmit = handleSubmit(async (values) => {

    try {
      const result =
        isEditing && editableFtsFunctionId != null
          ? await updateFtsFunction({
            id: String(editableFtsFunctionId),
            updateFtsFunctionDto: values,
          }).unwrap()
          : await createFtsFunction({ createFtsFunctionDto: values }).unwrap();

      dispatch(showSnackbar({ message: result.message }));
      closeForm();
    } catch (error) {
      // Глобальный обработчик ошибок (baseQuery) уже показывает тост.
      console.error("Не удалось сохранить функцию:", error);
    }
  });

  const filteredFtsFunctionNameOptions = useMemo(() => {
    return options.ftsFunctionNameOptions.filter(
      ({ value }) => {
        if (isEditing && (selectedFtsFunctionNameId === value)) return true;
        return !usedFtsFunctionNameIds.has(value);
      }
    );
  }, [options.ftsFunctionNameOptions, usedFtsFunctionNameIds, selectedFtsFunctionNameId, isEditing]);

  // ============ 8. Шапка ============
  const showHint = !expanded && !isEditing;
  const showAudit = Boolean(expanded && isEditing && ftsFunctionInfo);


  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: c.bgPaper,
        border: `1px solid ${c.borderMain}`,
        borderRadius: 2,
        mb: 2,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Box
        onClick={handleToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          px: 2.5,
          py: 1.5,
          cursor: "pointer",
          "&:hover": { bgcolor: c.hoverOverlay },
          transition: "background-color 0.15s",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isEditing ? (
            <EditOutlined sx={{ fontSize: 18, color: c.accentBlue }} />
          ) : (
            <Add sx={{ fontSize: 18, color: c.accentBlue }} />
          )}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: c.textPrimary,
                fontSize: "0.82rem",
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {isEditing
                ? `Редактирование функции #${editableFtsFunctionId}`
                : "Добавить функцию"}
            </Typography>
            {showHint && (
              <Typography
                variant="caption"
                sx={{ color: c.textMuted, fontSize: "0.68rem" }}
              >
                {"Нажмите, чтобы добавить новую функцию"}
              </Typography>
            )}
          </Box>
        </Box>

        {showAudit && ftsFunctionInfo && (
          <HeaderAudit
            createdAt={ftsFunctionInfo.createdAt}
            updatedAt={ftsFunctionInfo.updatedAt}
            textColor={c.textMuted}
            labelColor={c.textDim}
          />
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          {isEditing && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseEdit();
              }}
              sx={{ color: c.textMuted, "&:hover": { color: c.textPrimary } }}
              title={"Закрыть"}
            >
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <IconButton
            size="small"
            sx={{ color: c.textMuted }}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            {expanded ? (
              <ExpandLess sx={{ fontSize: 20 }} />
            ) : (
              <ExpandMore sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* ============ 9. Тело формы ============ */}
      <Collapse in={expanded} timeout={250}>
        <Box sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
          {isEditing && isFetching && !initialFormData.current ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={24} sx={{ color: c.accentBlue }} />
            </Box>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <Box sx={{ mb: 2 }}>
                {/* Классификация функции */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                    },
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <FormSelect
                    name="ftsFunctionNameId"
                    label="Наименование функции"
                    options={filteredFtsFunctionNameOptions}
                    control={control}
                    fullRow
                  />
                  <FormSelect
                    name="ftsFunctionMarkerId"
                    label="Маркер функции"
                    options={options.ftsFunctionMarkerOptions}
                    control={control}
                  />
                  <FormSelect
                    name="ftsCentralizationId"
                    label="Централизация функции"
                    options={options.ftsCentralizationOptions}
                    control={control}
                  />
                  <FormSelect
                    name="competencyCenterId"
                    label="Центр компетенций"
                    options={options.ftsCompetencyCenterOptions}
                    control={control}
                    wrap
                  />
                </Box>

                {/* Ответственные лица + ДТИ */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Stack spacing={2}>
                    <FormSelect
                      name="curatorCentralOfficeId"
                      label="Куратор ЦА"
                      options={options.centralOfficeCuratorOptions}
                      control={control}
                    />
                    <FormSelect
                      name="departmentHeadCentralOfficeId"
                      label="НУ/ЗНУ"
                      options={options.centralOfficeUserOptions}
                      control={control}
                    />
                    <FormSelect
                      name="managerInterregionalInspectionId"
                      label="Менеджер МИУДОЛ"
                      options={options.interregionalInspectionManagerOptions}
                      control={control}
                    />
                    <FormSelect
                      name="departmentHeadInterregionalInspectionId"
                      label="НИ/ЗНИ"
                      options={options.interregionalInspectionUserOptions}
                      control={control}
                    />
                  </Stack>

                  <Box sx={{ position: "relative", minHeight: 0 }}>
                    <DtiMultiSelect control={control} options={options.ftsDtiOptions} />
                  </Box>
                </Box>
              </Box>

              {/* Действия */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  mt: 1,
                  flexWrap: "wrap",
                }}
              >
                {isEditing ? (
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleCloseEdit}
                    disabled={submitting}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.78rem",
                      color: c.textSecondary,
                      "&:hover": { bgcolor: c.hoverOverlay, color: c.textPrimary },
                    }}
                  >
                    {"Отмена"}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="text"
                    onClick={handleClear}
                    disabled={submitting || !isDirty}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.78rem",
                      color: c.textSecondary,
                      "&:hover": { bgcolor: c.hoverOverlay, color: c.textPrimary },
                    }}
                  >
                    {"Очистить"}
                  </Button>
                )}

                <Button
                  type="submit"
                  size="small"
                  variant="contained"
                  disabled={!isValid || !isDirty || submitting}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.78rem",
                    bgcolor: c.accentBlue,
                    "&:hover": { bgcolor: c.accentBlue, filter: "brightness(1.08)" },
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={16} sx={{ color: "inherit" }} />
                  ) : isEditing ? (
                    "Сохранить изменения"
                  ) : (
                    "Добавить функцию"
                  )}
                </Button>
              </Box>
            </form>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
