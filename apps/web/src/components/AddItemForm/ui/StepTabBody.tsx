import type { AddItemFormValues, StepFields } from "../lib/schema";
import type { Theme } from "@mui/material";
import type { Control, FieldPath } from "react-hook-form";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { useMemo } from "react";
import { Controller } from "react-hook-form";
import {
    Autocomplete,
    Box,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import { findTypeNameByCode } from "src/entities/fts-function/api/mappers";
import {
    ACTIONS,
    CATEGORIES,
    COMPLEXITIES,
    PERIODICITIES,
} from "src/entities/fts-function/constants";
import {
    DETAIL_TYPE_CATEGORY,
    getTypeCodeOptionsByCategory,
    getTypeNameOptionsByCategory,
    hasTechnologicalSolution,
    isActualActionCategory,
    TECHNOLOGY_DETAIL_LABELS,
} from "src/entities/fts-function/lib/detail-technology";
import { MAX_PER_CATEGORY } from "src/shared/config/ui";
import { I18N, useTranslation } from "src/shared/i18n";
import { FieldLabel } from "src/shared/ui/form/FieldLabel";
import {
    formInputSx,
    formLabelSx,
    formMenuSx,
    formSelectSx,
} from "src/shared/ui/styles/form";

export const StepKey = {
    S1: "s1",
    S2: "s2",
} as const;

export type StepKey = (typeof StepKey)[keyof typeof StepKey];

type RHFFieldName = `${StepKey}.${keyof StepFields}`;

export type StepTabBodyProps = {
    control: Control<AddItemFormValues>;
    step: StepKey;
    fields: StepFields;
    currentCount: number;
    limitReached: boolean;
    filled: boolean;
    typesAll: TypeResponseDto[];
    theme: Theme;
};

export function StepTabBody({
                                control,
                                step,
                                fields,
                                limitReached,
                                filled,
                                typesAll,
                                theme,
                            }: StepTabBodyProps) {
    const { t } = useTranslation();
    const c = theme.custom;

    const whoOptions = useMemo(
        () =>
            getTypeNameOptionsByCategory(
                typesAll,
                DETAIL_TYPE_CATEGORY.WHO_PERFORMS_ACTION,
            ),
        [typesAll],
    );

    const responsibleOptions = useMemo(
        () =>
            getTypeNameOptionsByCategory(typesAll, DETAIL_TYPE_CATEGORY.RESPONSIBLE),
        [typesAll],
    );

    const technologicalSolutionOptions = useMemo(
        () =>
            getTypeCodeOptionsByCategory(
                typesAll,
                DETAIL_TYPE_CATEGORY.TECHNOLOGICAL_SOLUTION,
            ),
        [typesAll],
    );

    const isActualAction = isActualActionCategory(fields.category);
    const technologySelected = hasTechnologicalSolution(fields);

    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                px: 2,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
                pb: 1,
            }}
        >
            {limitReached && filled && (
                <Typography
                    variant="caption"
                    sx={{ color: theme.palette.warning.main, fontSize: "0.68rem" }}
                >
                    {t(I18N.addItem.limitReached, {
                        limit: MAX_PER_CATEGORY,
                        category: findTypeNameByCode(typesAll, fields.category),
                    })}
                </Typography>
            )}

            <FieldLabel fontSize="0.58rem" bold>
                {"Основные поля"}
            </FieldLabel>

            <RHFCodeSelect
                control={control}
                name={`${step}.category`}
                label={"Категория"}
                options={CATEGORIES}
                typesAll={typesAll}
                testId={`add-detail-category-${step}`}
                theme={theme}
            />

            <Controller
                control={control}
                name={`${step}.detailText`}
                render={({ field }) => (
                    <TextField
                        {...field}
                        label={"Детализация *"}
                        multiline
                        rows={2}
                        fullWidth
                        size="small"
                        sx={formInputSx(theme)}
                        data-testid={`add-detail-text-${step}`}
                    />
                )}
            />

            <RHFAutocomplete
                control={control}
                name={`${step}.who`}
                label={"Кто делает"}
                options={whoOptions}
                testId={`add-detail-who-${step}`}
                theme={theme}
            />

            <RHFCodeSelect
                control={control}
                name={`${step}.actionLabel`}
                label={"Что делать"}
                options={ACTIONS}
                typesAll={typesAll}
                testId={`add-detail-action-${step}`}
                theme={theme}
            />

            <Divider sx={{ borderColor: c.borderLight, my: 0.5 }} />

            <FieldLabel fontSize="0.58rem" bold>
                {"Дополнительные сведения"}
            </FieldLabel>

            <RHFCodeSelect
                control={control}
                name={`${step}.periodicity`}
                label={"Периодичность"}
                options={PERIODICITIES}
                typesAll={typesAll}
                testId={`add-detail-periodicity-${step}`}
                theme={theme}
            />

            <RHFCodeSelect
                control={control}
                name={`${step}.complexity`}
                label={"Сложность"}
                options={COMPLEXITIES}
                typesAll={typesAll}
                testId={`add-detail-complexity-${step}`}
                theme={theme}
            />

            <RHFTextInput
                control={control}
                name={`${step}.artifact`}
                label={"Артефакт"}
                testId={`add-detail-artifact-${step}`}
                theme={theme}
            />

            <RHFTextInput
                control={control}
                name={`${step}.basis`}
                label={"Основание"}
                testId={`add-detail-basis-${step}`}
                theme={theme}
            />

            <RHFTextInput
                control={control}
                name={`${step}.artifactUsage`}
                label={"Использование артефакта"}
                testId={`add-detail-artifact-usage-${step}`}
                multiline
                theme={theme}
            />

            <RHFTextInput
                control={control}
                name={`${step}.purpose`}
                label={"Цель"}
                testId={`add-detail-purpose-${step}`}
                multiline
                theme={theme}
            />

            {isActualAction && (
                <>
                    <Divider sx={{ borderColor: c.borderLight, my: 0.5 }} />

                    <RHFTypeCodeSelect
                        control={control}
                        name={`${step}.technologicalSolution`}
                        label={TECHNOLOGY_DETAIL_LABELS.technologicalSolution}
                        options={technologicalSolutionOptions}
                        testId={`add-detail-technological-solution-${step}`}
                        theme={theme}
                    />

                    <RHFTextInput
                        control={control}
                        name={`${step}.number`}
                        label={`${TECHNOLOGY_DETAIL_LABELS.number}${technologySelected ? " *" : ""}`}
                        testId={`add-detail-number-${step}`}
                        disabled={!technologySelected}
                        theme={theme}
                    />

                    <RHFAutocomplete
                        control={control}
                        name={`${step}.responsible`}
                        label={`${TECHNOLOGY_DETAIL_LABELS.responsible}${technologySelected ? " *" : ""}`}
                        options={responsibleOptions}
                        testId={`add-detail-responsible-${step}`}
                        disabled={!technologySelected}
                        theme={theme}
                    />

                    <RHFTextInput
                        control={control}
                        name={`${step}.algorithm`}
                        label={`${TECHNOLOGY_DETAIL_LABELS.algorithm}${technologySelected ? " *" : ""}`}
                        testId={`add-detail-algorithm-${step}`}
                        disabled={!technologySelected}
                        multiline
                        theme={theme}
                    />
                </>
            )}
        </Box>
    );
}

type RHFCodeSelectProps<T extends string> = {
    control: Control<AddItemFormValues>;
    name: RHFFieldName;
    label: string;
    options: readonly T[];
    typesAll: TypeResponseDto[];
    testId: string;
    theme: Theme;
};

export function RHFCodeSelect<T extends string>({
                                                    control,
                                                    name,
                                                    label,
                                                    options,
                                                    typesAll,
                                                    testId,
                                                    theme,
                                                }: RHFCodeSelectProps<T>) {
    return (
        <Controller
            control={control}
            name={name as FieldPath<AddItemFormValues>}
            render={({ field }) => (
                <FormControl size="small" fullWidth>
                    <InputLabel sx={formLabelSx(theme)}>{label}</InputLabel>
                    <Select
                        value={String(field.value ?? "")}
                        onChange={(e) => field.onChange(e.target.value)}
                        label={label}
                        sx={formSelectSx(theme)}
                        MenuProps={formMenuSx(theme)}
                        data-testid={testId}
                    >
                        {options.map((o) => (
                            <MenuItem key={o} value={o} sx={{ fontSize: "0.78rem" }}>
                                {findTypeNameByCode(typesAll, o)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        />
    );
}

type RHFTypeCodeSelectProps = {
    control: Control<AddItemFormValues>;
    name: RHFFieldName;
    label: string;
    options: TypeResponseDto[];
    testId: string;
    theme: Theme;
};

function RHFTypeCodeSelect({
                               control,
                               name,
                               label,
                               options,
                               testId,
                               theme,
                           }: RHFTypeCodeSelectProps) {
    const c = theme.custom;

    return (
        <Controller
            control={control}
            name={name as FieldPath<AddItemFormValues>}
            render={({ field }) => (
                <FormControl size="small" fullWidth>
                    <InputLabel sx={formLabelSx(theme)}>{label}</InputLabel>
                    <Select
                        value={String(field.value ?? "")}
                        onChange={(e) => field.onChange(e.target.value)}
                        label={label}
                        sx={formSelectSx(theme)}
                        MenuProps={formMenuSx(theme)}
                        data-testid={testId}
                    >
                        <MenuItem
                            value=""
                            sx={{
                                fontSize: "0.78rem",
                                fontStyle: "italic",
                                color: c.textDim,
                            }}
                        >
                            {"— не выбрано —"}
                        </MenuItem>

                        {options.map((option) => (
                            <MenuItem
                                key={option.code}
                                value={option.code}
                                sx={{ fontSize: "0.78rem" }}
                            >
                                {option.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        />
    );
}

type RHFTextInputProps = {
    control: Control<AddItemFormValues>;
    name: RHFFieldName;
    label: string;
    testId: string;
    multiline?: boolean;
    disabled?: boolean;
    theme: Theme;
};

function RHFTextInput({
                          control,
                          name,
                          label,
                          testId,
                          multiline = false,
                          disabled = false,
                          theme,
                      }: RHFTextInputProps) {
    return (
        <Controller
            control={control}
            name={name as FieldPath<AddItemFormValues>}
            render={({ field }) => (
                <TextField
                    {...field}
                    label={label}
                    multiline={multiline}
                    rows={multiline ? 2 : undefined}
                    fullWidth
                    size="small"
                    disabled={disabled}
                    sx={formInputSx(theme)}
                    data-testid={testId}
                />
            )}
        />
    );
}

type RHFAutocompleteProps = {
    control: Control<AddItemFormValues>;
    name: RHFFieldName;
    label: string;
    options: readonly string[];
    testId: string;
    disabled?: boolean;
    theme: Theme;
};

function RHFAutocomplete({
                             control,
                             name,
                             label,
                             options,
                             testId,
                             disabled = false,
                             theme,
                         }: RHFAutocompleteProps) {
    const c = theme.custom;

    return (
        <Controller
            control={control}
            name={name as FieldPath<AddItemFormValues>}
            render={({ field }) => (
                <Autocomplete
                    freeSolo
                    disabled={disabled}
                    options={options}
                    value={String(field.value ?? "")}
                    onChange={(_, v) => field.onChange(v ?? "")}
                    onInputChange={(_, v) => field.onChange(v)}
                    size="small"
                    fullWidth
                    slotProps={{
                        paper: {
                            sx: {
                                bgcolor: c.bgMenu,
                                color: c.textBody,
                                border: `1px solid ${c.borderMain}`,
                            },
                        },
                        listbox: {
                            sx: {
                                py: 0,
                                "& .MuiAutocomplete-option": {
                                    minHeight: 28,
                                    fontSize: "0.78rem",
                                    py: 0.25,
                                },
                            },
                        },
                    }}
                    renderOption={(props, option) => {
                        const { key, ...rest } = props as typeof props & { key?: string };

                        return (
                            <Tooltip key={key ?? option} title={option} placement="right">
                                <li {...rest}>{option}</li>
                            </Tooltip>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={label}
                            sx={formInputSx(theme)}
                            data-testid={testId}
                        />
                    )}
                />
            )}
        />
    );
}