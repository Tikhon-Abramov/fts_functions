import { Autocomplete, Box, Checkbox, IconButton, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { Close as CloseIcon, Search as SearchIcon } from "@mui/icons-material";
import { Controller, type Control } from "react-hook-form";
import type { OptionType } from "../../utils/create-options";
import type { FtsFunctionFormData } from "./schema";



type DtiMultiSelectProps = {
  control: Control<FtsFunctionFormData>;
  options: OptionType[];
};


export function DtiMultiSelect({ control, options }: DtiMultiSelectProps) {
  const theme = useTheme();
  const c = theme.custom;

  return (
    <Controller<FtsFunctionFormData, "dtiIds">
      name="dtiIds"
      control={control}
      render={({ field }) => {
        const selected: OptionType[] = field.value
          .map((id) => options.find((o) => o.value === id))
          .filter((o): o is OptionType => o !== undefined);

        const handleChange = (next: OptionType[]): void => {
          field.onChange(next.map((o) => o.value));
        };

        const handleRemove = (value: OptionType["value"]): void => {
          handleChange(selected.filter((o) => o.value !== value));
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
              pt: 1.25,
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
              <Autocomplete<OptionType, true, false, false>
                multiple
                disableCloseOnSelect
                size="small"
                options={options}
                value={selected}
                onChange={(_, next) => handleChange(next)}
                onBlur={field.onBlur}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                renderValue={() => null}
                slotProps={{ listbox: { sx: { maxHeight: 360 } } }}
                sx={{ flex: 1, minWidth: 0, overflow: "visible" }}
                renderOption={(props, option, { selected: isSelected }) => {
                  const { key, ...rest } = props as typeof props & {
                    key?: string;
                  };
                  return (
                    <li key={key ?? option.value} {...rest}>
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
                          bgcolor: c.strategyChipColor,
                          flexShrink: 0,
                          mr: 1,
                        }}
                      />
                      <Typography sx={{ fontSize: "0.78rem" }}>
                        {option.label}
                      </Typography>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={"ДТИ (Проект «Стратегия Д»)"}
                    placeholder={selected.length === 0 ? "Поиск ДТИ..." : ""}
                    slotProps={{
                      ...params.slotProps,
                      inputLabel: {
                        ...params.slotProps.inputLabel,
                        shrink: true,
                        sx: {
                          fontSize: "0.82rem",
                          maxWidth: "calc(100% - 24px)",
                          overflow: "visible",
                          bgcolor: c.bgPaper,
                          px: 0.5,
                        },
                      },
                      input: {
                        ...params.slotProps.input,
                        notched: true,
                        startAdornment: (
                          <InputAdornment position="start" sx={{ ml: 0.5 }}>
                            <SearchIcon
                              sx={{ fontSize: 18, color: c.textMuted }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      overflow: "visible",
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.82rem",
                        bgcolor: c.hoverOverlay,
                      },
                      "& .MuiOutlinedInput-notchedOutline legend": {
                        maxWidth: "100%",
                      },
                    }}
                  />
                )}
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
                {`${selected.length} / ${options.length}`}
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
                <Stack spacing={0.5} sx={{ flex: 1, overflowY: "auto", p: 0.5 }}>
                  {selected.map((dti) => (
                    <Box
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
                          bgcolor: c.strategyChipColor,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ flex: 1, fontSize: "0.78rem", color: "inherit" }}
                      >
                        {dti.label}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(dti.value)}
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
                    {"Ничего не выбрано — начните поиск выше"}
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
