import { useTheme } from "@mui/material";
import { FtsFunctionActionType } from "src/entities/fts-function/model";

export type ActionChipColor = { bg: string; color: string; border: string };

export function useActionChipColors(): Record<
  FtsFunctionActionType,
  ActionChipColor
> {
  const theme = useTheme();
  const c = theme.custom;
  return {
    [FtsFunctionActionType.KEEP]: c.actionLeave,
    [FtsFunctionActionType.TRANSFER]: c.actionTransfer,
    [FtsFunctionActionType.OPTIMIZE]: c.actionOptimize,
    [FtsFunctionActionType.OPTIMIZE_TRANSFER]: c.actionOptTransfer,
    [FtsFunctionActionType.REMOVE]: c.actionRemove,
  };
}
