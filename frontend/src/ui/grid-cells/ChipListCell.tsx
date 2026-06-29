import { Box, Chip } from "@mui/material";



export type ChipListCellProps = {
  values: readonly string[] | undefined;
  borderColor: string;
  textColor: string;
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
        minHeight: '44px',
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
