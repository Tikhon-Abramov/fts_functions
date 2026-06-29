import {
  Autocomplete,
  Box,
  FormControl,
  FormHelperText,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useTheme,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { Controller, type Control, type FieldPath } from "react-hook-form";
import type { OptionType } from "../../utils/create-options";
import type { FtsFunctionFormData } from "./schema";


const SEARCHABLE_THRESHOLD = 20;

export type FormSelectProps = {
  name: FieldPath<FtsFunctionFormData>;
  label: string;
  options: OptionType[];
  control: Control<FtsFunctionFormData>;
  fullRow?: boolean;
  wrap?: boolean;
  wrapperRef?: ((node: HTMLDivElement | null) => void) | undefined;
};



export function FormSelect({
  name,
  label,
  options,
  control,
  fullRow,
  wrap,
  wrapperRef,
}: FormSelectProps) {
  const theme = useTheme();
  const c = theme.custom;

  const sxField = {
    "& .MuiOutlinedInput-root": {
      fontSize: "0.82rem",
      bgcolor: c.hoverOverlay,
    },
    "& .MuiInputLabel-root": { fontSize: "0.82rem" },
    ...(fullRow ? { gridColumn: "1 / -1" } : {}),
  };
  const sxItem = wrap
    ? { fontSize: "0.78rem", whiteSpace: "normal", maxWidth: 500 }
    : { fontSize: "0.82rem" };

  const isSearchable = options.length > SEARCHABLE_THRESHOLD;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        if (isSearchable) {
          const selected = options.find((o) => o.value === field.value) ?? null;

          return (
            <Box sx={sxField} ref={wrapperRef}>
              <Autocomplete<OptionType, false, false, false>
                size="small"
                options={options}
                value={selected}
                onChange={(_, next) =>
                  field.onChange(next ? next.value : Number.NaN)
                }
                onBlur={field.onBlur}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.value === b.value}
                slotProps={{ listbox: { sx: { maxHeight: 320 } } }}
                renderOption={(props, option) => {
                  const { key, ...rest } = props as typeof props & {
                    key?: string;
                  };
                  return (
                    <li key={key ?? option.value} {...rest}>
                      <Box sx={sxItem}>{option.label}</Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={label}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                    slotProps={{
                      ...params.slotProps,
                      input: {
                        ...params.slotProps.input,
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
                      "& .MuiOutlinedInput-root": {
                        fontSize: "0.82rem",
                        bgcolor: c.hoverOverlay,
                      },
                      "& .MuiInputLabel-root": { fontSize: "0.82rem" },
                    }}
                  />
                )}
              />
            </Box>
          );
        }

        return (
          <FormControl
            size="small"
            fullWidth
            error={Boolean(fieldState.error)}
            sx={sxField}
            ref={wrapperRef}
          >
            <InputLabel sx={{ fontSize: "0.82rem" }}>{label}</InputLabel>
            <Select
              value={Number.isNaN(field.value as number) ? "" : (field.value as number)}
              onChange={(e) => field.onChange(!e.target.value ? Number.NaN : Number(e.target.value))}
              onBlur={field.onBlur}
              inputRef={field.ref}
              label={label}
              sx={{ fontSize: "0.82rem", bgcolor: c.hoverOverlay }}
            >
              {options.map((o) => (
                <MenuItem key={o.value} value={o.value} sx={sxItem}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
            {fieldState.error?.message && (
              <FormHelperText>{fieldState.error.message}</FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
}
