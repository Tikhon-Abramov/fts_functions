/**
 * Discrete tabs in the detailization-modal right-side panel.
 * Numeric values are kept stable for redux-persist/backward compatibility.
 */
export const RightTab = {
  LINKS: 0,
  DETAILS: 1,

  /**
   * Deprecated: the add-detail form was moved from the right panel to the
   * modal header. Keep the value so persisted old UI state can be normalized.
   */
  ADD: 2,

  LINKER: 3,
} as const;

export type RightTab = (typeof RightTab)[keyof typeof RightTab];

/**
 * Ordered list useful for `.map`-driven `<Tab>` rendering.
 * The add tab is intentionally excluded from the right-side panel.
 */
export const RIGHT_TAB_ORDER: readonly RightTab[] = [
  RightTab.DETAILS,
  RightTab.LINKS,
  RightTab.LINKER,
];