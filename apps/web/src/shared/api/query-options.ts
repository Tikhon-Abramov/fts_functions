/**
 * Shared RTK Query options presets.
 *
 * These bundle polling + focus-refetch settings so call-sites can pass a
 * single named constant instead of re-inlining the same object literal.
 * Only the write-how differs — behaviour is identical to the hand-written
 * literals these replace.
 */
import {
  POLL_INTERVALS,
  POLL_SKIP_WHEN_UNFOCUSED,
} from "src/shared/config/polling";

/** Slowly-polled dictionary queries (Type + User lists). */
export const DICTIONARY_QUERY_OPTIONS = {
  pollingInterval: POLL_INTERVALS.DICTIONARY_MS,
  skipPollingIfUnfocused: POLL_SKIP_WHEN_UNFOCUSED,
  refetchOnFocus: true,
} as const;

/** Main FtsFunction list query (first page subscribed for polling). */
export const LIST_QUERY_OPTIONS = {
  pollingInterval: POLL_INTERVALS.LIST_MS,
  skipPollingIfUnfocused: POLL_SKIP_WHEN_UNFOCUSED,
  refetchOnFocus: true,
} as const;

/** Single-function detail query inside the modal. */
export const DETAIL_QUERY_OPTIONS = {
  pollingInterval: POLL_INTERVALS.DETAIL_MS,
  skipPollingIfUnfocused: POLL_SKIP_WHEN_UNFOCUSED,
  refetchOnFocus: true,
} as const;
