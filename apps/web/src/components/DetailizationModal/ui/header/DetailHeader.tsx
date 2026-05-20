import { Close } from "@mui/icons-material";
import {
  Box,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { I18N, useTranslation } from "src/shared/i18n";

export const DETAIL_HEADER_TEST_IDS = {
  TITLE: "text-modal-title",
  SUBTITLE: "text-modal-subtitle",
  STEP1_COUNT: "text-step1-row-count",
  STEP2_COUNT: "text-step2-row-count",
  LINK_COUNT: "text-link-count",
  CLOSE: "button-close-modal",
} as const;

export type DetailHeaderProps = {
  title: string;
  step1Count: number;
  step2Count: number;
  linkCount: number;
  onClose: () => void;
};

/**
 * Modal title bar: localized title, dynamic subtitle, three counter chips,
 * and a close button.
 */
export function DetailHeader({
  title,
  step1Count,
  step2Count,
  linkCount,
  onClose,
}: DetailHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const c = theme.custom;

  return (
    <DialogTitle
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: 3,
        py: 1.5,
        borderBottom: `1px solid ${c.borderMain}`,
        flexShrink: 0,
      }}
    >
      <Box>
        <Typography
          variant="h6"
          sx={{ color: c.textBright, fontWeight: 600, fontSize: "1.1rem" }}
          data-testid={DETAIL_HEADER_TEST_IDS.TITLE}
        >
          {"Детализация"}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: c.textMuted, fontSize: "0.75rem" }}
          data-testid={DETAIL_HEADER_TEST_IDS.SUBTITLE}
        >
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {[
          {
            testId: DETAIL_HEADER_TEST_IDS.STEP1_COUNT,
            i18nKey: I18N.modal.step1Counter,
            count: step1Count,
          },
          {
            testId: DETAIL_HEADER_TEST_IDS.STEP2_COUNT,
            i18nKey: I18N.modal.step2Counter,
            count: step2Count,
          },
          {
            testId: DETAIL_HEADER_TEST_IDS.LINK_COUNT,
            i18nKey: I18N.modal.linkCounter,
            count: linkCount,
          },
        ].map(({ testId, i18nKey, count }) => (
          <Typography
            key={testId}
            variant="caption"
            sx={{ color: c.textDim, fontSize: "0.7rem" }}
            data-testid={testId}
          >
            {t(i18nKey, { count })}
          </Typography>
        ))}
        <IconButton
          onClick={onClose}
          sx={{ color: c.textSecondary, "&:hover": { color: c.textBright } }}
          data-testid={DETAIL_HEADER_TEST_IDS.CLOSE}
        >
          <Close />
        </IconButton>
      </Box>
    </DialogTitle>
  );
}
