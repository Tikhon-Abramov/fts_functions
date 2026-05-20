/** Snackbar display/dismissal behavior. */
// prettier-ignore
export const SNACKBAR = {
  /** How long a snackbar stays visible before auto-hiding (ms). */
  AUTO_HIDE_MS: 6_000,
  /** Shorter auto-hide duration for transient confirmations (ms). */
  AUTO_HIDE_MS_SHORT: 5_000,
  /** Max number of messages stacked at once. */
  MAX_QUEUE: 3,
  /** Anchor position on screen. */
  ANCHOR_VERTICAL: 'top' as const,
  ANCHOR_HORIZONTAL: 'center' as const,
} as const;
