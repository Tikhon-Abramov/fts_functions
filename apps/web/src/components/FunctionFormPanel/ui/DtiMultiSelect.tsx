import type { Control } from "react-hook-form";
import type { FunctionFormFields } from "src/entities/fts-function/lib/function-form-schema";
import type { TypeResponseDto } from "src/shared/api/ftsFunctionsApi";

import { Controller } from "react-hook-form";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Checkbox,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
export type DtiMultiSelectProps = {
  control: Control<FunctionFormFields>;
  dtis: TypeResponseDto[];
};

/**
 * RHF-controlled multi-select for DTI ids. Search-first input on top,
 * selected items render as a vertical stack below — keeps the input clean
 * for searching and gives multi-selection room to breathe vertically.
 *
 * Baseline chips are detached on submit via the backend's
 * `DELETE /v1/fts-functions/:id/dtis/:dtiId` endpoint; newly-added chips
 * are attached via the existing batch-attach call. Both flows are
 * orchestrated by `useFunctionForm`.
 */
export function DtiMultiSelect({ control, dtis }: DtiMultiSelectProps) {
  const theme = useTheme();
  const c = theme.custom;

  return (
    <Controller<FunctionFormFields, "strategyProjectIds">
      name="strategyProjectIds"
      control={control}
      render={({ field }) => {
        const selected: TypeResponseDto[] = field.value
          .map((id) => dtis.find((d) => String(d.id) === id))
          .filter((d): d is TypeResponseDto => d !== undefined);

        const handleChange = (next: TypeResponseDto[]): void => {
          field.onChange(next.map((d) => String(d.id)));
        };

        const handleRemove = (id: TypeResponseDto["id"]): void => {
          handleChange(selected.filter((d) => d.id !== id));
        };

        return (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1,
                flexShrink: 0,
              }}
            >
              <Autocomplete<TypeResponseDto, true, false, false>
                multiple
                disableCloseOnSelect
                size="small"
                options={dtis}
                value={selected}
                onChange={(_, next) => handleChange(next)}
                onBlur={field.onBlur}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                renderTags={() => null}
                slotProps={{ listbox: { sx: { maxHeight: 360 } } }}
                sx={{ flex: 1, minWidth: 0 }}
                renderOption={(props, option, { selected: isSelected }) => {
                  const { key, ...rest } = props as typeof props & {
                    key?: string;
                  };
                  const optionColor = option.color ?? c.strategyChipColor;
                  return (
                    <li key={key ?? option.id} {...rest}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        sx={{ mr: 1, p: 0.5 }}
                      />
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: optionColor,
                          flexShrink: 0,
                          mr: 1,
                        }}
                      />
                      <Typography sx={{ fontSize: "0.78rem" }}>
                        {option.name}
                      </Typography>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={"ДТИ (Проект «Стратегия Д»)"}
                    placeholder={selected.length === 0 ? "Поиск ДТИ..." : ""}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      ...params.InputProps,
                      notched: true,
                      startAdornment: (
                        <InputAdornment position="start" sx={{ ml: 0.5 }}>
                          <SearchIcon
                            sx={{ fontSize: 18, color: c.textMuted }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.82rem",
                        bgcolor: c.hoverOverlay,
                      },
                      // The startAdornment (search icon) shifts the input
                      // content right but MUI's notched label keeps its
                      // original position — long labels get cropped by the
                      // notch. Widening the legend's letter-spacing budget
                      // gives the full text room.
                      "& .MuiInputLabel-root": {
                        fontSize: "0.82rem",
                        maxWidth: "calc(133% - 32px)",
                      },
                      "& .MuiOutlinedInput-notchedOutline legend": {
                        maxWidth: "100%",
                      },
                    }}
                  />
                )}
                data-testid="create-strategy-projects-select"
              />
              <Typography
                variant="caption"
                sx={{
                  color: selected.length > 0 ? c.textSecondary : c.textMuted,
                  fontSize: "0.7rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {`${selected.length} / ${dtis.length}`}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                border: `1px solid ${c.borderMain}`,
                borderRadius: 1,
                bgcolor: c.hoverOverlay,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {selected.length > 0 ? (
                <Stack
                  spacing={0.5}
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: 0.5,
                  }}
                >
                  {selected.map((dti) => (
                    <DtiRow
                      key={dti.id}
                      dti={dti}
                      fallbackColor={c.strategyChipColor}
                      onRemove={handleRemove}
                    />
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: c.textMuted,
                      fontSize: "0.72rem",
                      fontStyle: "italic",
                      textAlign: "center",
                    }}
                  >
                    Ничего не выбрано — начните поиск выше
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        );
      }}
    />
  );
}

type DtiRowProps = {
  dti: TypeResponseDto;
  fallbackColor: string;
  onRemove: (id: TypeResponseDto["id"]) => void;
};

function DtiRow({ dti, fallbackColor, onRemove }: DtiRowProps) {
  const color = dti.color ?? fallbackColor;
  return (
    <Box
      data-type-code={dti.code}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1,
        py: 0.5,
        borderRadius: 0.75,
        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: color,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        sx={{ flex: 1, fontSize: "0.78rem", color: "inherit" }}
      >
        {dti.name}
      </Typography>
      <IconButton
        size="small"
        onClick={() => onRemove(dti.id)}
        sx={{
          p: 0.25,
          color: "inherit",
          opacity: 0.6,
          "&:hover": { opacity: 1 },
        }}
        aria-label="Удалить"
      >
        <CloseIcon sx={{ fontSize: 14 }} />
      </IconButton>
    </Box>
  );
}
