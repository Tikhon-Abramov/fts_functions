/**
 * Discrete tabs in the detailization-modal right-side panel. Numeric values
 * mirror the order Material UI's `<Tabs />` assigns by index — the redux
 * slice still stores the raw number for backward compatibility, but every
 * component uses `RightTab` symbols to avoid magic integers.
 */
export const RightTab = {
  LINKS: 0,
  DETAILS: 1,
  ADD: 2,
  LINKER: 3,
} as const;
export type RightTab = (typeof RightTab)[keyof typeof RightTab];

/**
 * Ordered list useful for `.map`-driven `<Tab>` rendering. Order:
 * Сведения → Добавить → Связи → Связыватель (Linker).
 * `DETAILS` first means the row's information is the user's primary entry
 * point when a row is selected.
 */
export const RIGHT_TAB_ORDER: readonly RightTab[] = [
  RightTab.DETAILS,
  RightTab.ADD,
  RightTab.LINKS,
  RightTab.LINKER,
];
