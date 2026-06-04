import type { Control, FieldPath } from "react-hook-form";
import type { FunctionFormFields } from "src/entities/fts-function/lib/function-form-schema";
import type { UserResponseDto } from "src/shared/api/ftsFunctionsApi";

import { Controller } from "react-hook-form";
import { Search as SearchIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  type UserSlot,
  useUsersBySlot,
} from "src/entities/fts-function/hooks/selectors/useUsersBySlot";

/**
 * RHF-controlled MUI Select bound to one of the four "user" form fields. The
 * `slot` prop drives which subset of users is offered — replacing four
 * near-identical `useMemo` filter blocks at the call site.
 */
/**
 * Class 2 — const-as-const for the four `UserSelect`-bound RHF field names.
 * Co-located with the component; consumers reference values via
 * `UserSelectName.<KEY>` so every callsite shares one symbol.
 */
export const UserSelectName = {
  CURATOR_CENTRAL_OFFICE_ID: "curatorCentralOfficeId",
  DEPARTMENT_HEAD_CENTRAL_OFFICE_ID: "departmentHeadCentralOfficeId",
  MANAGER_INTERREGIONAL_INSPECTION_ID: "managerInterregionalInspectionId",
  DEPARTMENT_HEAD_INTERREGIONAL_INSPECTION_ID:
    "departmentHeadInterregionalInspectionId",
} as const;

export type UserSelectName =
  (typeof UserSelectName)[keyof typeof UserSelectName];

export type UserSelectProps = {
  name: UserSelectName;
  label: string;
  slot: UserSlot;
  users: UserResponseDto[];
  control: Control<FunctionFormFields>;
  testId: string;
};

export function UserSelect({
  name,
  label,
  slot,
  users,
  control,
  testId,
}: UserSelectProps) {
  const theme = useTheme();
  const c = theme.custom;
  const filtered = useUsersBySlot(users, slot);
  const sxField = {
    "& .MuiOutlinedInput-root": {
      fontSize: "0.82rem",
      bgcolor: c.hoverOverlay,
    },
    "& .MuiInputLabel-root": { fontSize: "0.82rem" },
  };
  // Prefer `shortName` ("Баркарь А. В.") over the verbose ~50–60 char
  // `fullName`. Treat empty strings as missing — backend may persist `""`
  // for unset display names rather than null. Mirrors `userName()` in
  // entities/fts-function/api/mappers.ts.
  const userLabel = (u: UserResponseDto) => {
    const short = u.shortName?.trim();
    if (short) return short;
    const full = u.fullName?.trim();
    if (full) return full;
    return `#${u.id}`;
  };

  // Always render searchable Autocomplete for user pickers — user lists
  // grow with department onboarding, and search is cheap. Type pickers
  // (centralization, marker, etc.) keep their threshold-based logic in
  // TypeSelect since those are bounded enums.
  return (
    <Controller<FunctionFormFields, FieldPath<FunctionFormFields>>
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const valueStr = typeof field.value === "string" ? field.value : "";
        const selectedUser =
          filtered.find((u) => String(u.id) === valueStr) ?? null;
        return (
          <Box sx={sxField}>
            <Autocomplete<UserResponseDto, false, false, false>
              size="small"
              options={filtered}
              value={selectedUser}
              onChange={(_, next) =>
                field.onChange(next ? String(next.id) : "")
              }
              onBlur={field.onBlur}
              getOptionLabel={userLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              slotProps={{ listbox: { sx: { maxHeight: 320 } } }}
              renderOption={(props, option) => {
                const { key, ...rest } = props as typeof props & {
                  key?: string;
                };
                const label = userLabel(option);
                const tooltip = option.fullName?.trim() ?? "";
                return (
                  <li key={key ?? option.id} {...rest}>
                    <Tooltip title={tooltip} placement="right">
                      <Typography
                        component="span"
                        sx={{
                          fontSize: "0.82rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "100%",
                          display: "block",
                        }}
                      >
                        {label}
                      </Typography>
                    </Tooltip>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label}
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  inputRef={field.ref}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start" sx={{ ml: 0.5 }}>
                        <SearchIcon sx={{ fontSize: 18, color: c.textMuted }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: "0.82rem",
                      bgcolor: c.hoverOverlay,
                    },
                    "& .MuiInputLabel-root": { fontSize: "0.82rem" },
                  }}
                  data-testid={testId}
                />
              )}
            />
          </Box>
        );
      }}
    />
  );
}
