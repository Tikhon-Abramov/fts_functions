import { Box, Typography } from "@mui/material";
import { formatAuditTimestamp } from "../../utils/format-timestamp";



type HeaderAuditProps = {
  createdAt: string;
  updatedAt: string;
  textColor: string;
  labelColor: string;
};

type HeaderAuditEntryProps = {
  label: string;
  value: string;
  labelColor: string;
  textColor: string;
};



function HeaderAuditEntry({
  label,
  value,
  labelColor,
  textColor,
}: HeaderAuditEntryProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
      <Typography
        component="span"
        sx={{
          color: labelColor,
          fontSize: "inherit",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        component="span"
        sx={{
          color: textColor,
          fontSize: "inherit",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}



export function HeaderAudit({
  createdAt,
  updatedAt,
  textColor,
  labelColor,
}: HeaderAuditProps) {
  const created = formatAuditTimestamp(createdAt);
  const updated = formatAuditTimestamp(updatedAt);
  const sameTime = created === updated;

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 0.25,
        fontSize: "0.7rem",
      }}
    >
      <HeaderAuditEntry
        label="Создано"
        value={created}
        labelColor={labelColor}
        textColor={textColor}
      />
      {!sameTime && (
        <>
          <Box
            aria-hidden
            sx={{
              width: 80,
              borderTop: `1px solid ${labelColor}`,
              opacity: 0.4,
            }}
          />
          <HeaderAuditEntry
            label="Обновлено"
            value={updated}
            labelColor={labelColor}
            textColor={textColor}
          />
        </>
      )}
    </Box>
  );
}
