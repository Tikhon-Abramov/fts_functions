/**
 * `ChipListCell` — wraps a string array into a row of small outlined Chips.
 * Used for the "strategy projects" column where each item is a short code.
 *
 * When a `colorFor` callback is provided, each chip is prefixed with an 8x8
 * coloured dot — mirroring the visual treatment in the function-edit card's
 * `DtiMultiSelect` autocomplete dropdown so the table column and the form
 * agree on chip identity at a glance. The callback is invoked once per value
 * with the chip's label; falsy returns fall back to `textColor`.
 */
import { Box, Chip } from "@mui/material";
import { ROW_HEIGHT } from "src/shared/config";

export type ChipListCellProps = {
  values: readonly string[] | undefined;
  borderColor: string;
  textColor: string;
  /** Optional per-value colour resolver. When omitted, no dot is rendered
   *  (legacy chip-only display). */
  colorFor?: (value: string) => string | null | undefined;
};

export function ChipListCell({
  values,
  borderColor,
  textColor,
  colorFor,
}: ChipListCellProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
        py: 0.5,
        alignItems: "center",
        minHeight: `${ROW_HEIGHT}px`,
      }}
    >
      {values?.map((code) => {
        const dotColor = colorFor?.(code);
        const label =
          colorFor === undefined ? (
            code
          ) : (
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center" }}
            >
              <Box
                component="span"
                data-testid="chip-list-dot"
                data-color={dotColor ?? textColor}
                sx={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: dotColor ?? textColor,
                  flexShrink: 0,
                  mr: 0.75,
                }}
              />
              {code}
            </Box>
          );
        return (
          <Chip
            key={code}
            label={label}
            size="small"
            variant="outlined"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              borderColor,
              color: textColor,
              bgcolor: "transparent",
              "& .MuiChip-label": { px: 0.75 },
            }}
          />
        );
      })}
    </Box>
  );
}
