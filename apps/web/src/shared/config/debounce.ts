/** Debounce delays (ms) for input handlers. */
// prettier-ignore
export const DEBOUNCE_MS = {
  /** Search input above the main DataGrid — fires FTS query after user stops typing. */
  SEARCH: 400,
  /** Generic text input — use for future search boxes in modals. */
  TEXT_INPUT: 300,
} as const;
