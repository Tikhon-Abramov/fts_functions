/** RTK Query polling intervals, in milliseconds. */
// prettier-ignore
export const POLL_INTERVALS = {
  /** Main function list — polled at moderate rate. */
  LIST_MS:   30_000,
  /** Single function detail — polled faster since user is actively looking. */
  DETAIL_MS:  5_000,
  /** Dictionary (Type + User) lists — rarely change, poll slowly. */
  DICTIONARY_MS: 120_000,
} as const;

/** When true, RTK Query pauses polling while the browser tab is unfocused. */
export const POLL_SKIP_WHEN_UNFOCUSED = true;
