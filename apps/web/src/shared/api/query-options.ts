/**
 * Shared RTK Query options presets.
 *
 * Автоматический polling отключён, чтобы открытая детализация не создавала
 * постоянный поток запросов и не выбивала API в 429 Too Many Requests.
 */

export const DICTIONARY_QUERY_OPTIONS = {
  pollingInterval: 0,
  skipPollingIfUnfocused: true,
  refetchOnFocus: false,
  refetchOnReconnect: false,
} as const;

export const LIST_QUERY_OPTIONS = {
  pollingInterval: 0,
  skipPollingIfUnfocused: true,
  refetchOnFocus: false,
  refetchOnReconnect: false,
} as const;

export const DETAIL_QUERY_OPTIONS = {
  pollingInterval: 0,
  skipPollingIfUnfocused: true,
  refetchOnFocus: false,
  refetchOnReconnect: false,
} as const;