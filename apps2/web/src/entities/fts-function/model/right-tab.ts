export const RightTab = {
  LINKS: 0,
  DETAILS: 1,
  /**
   * Deprecated: форма добавления теперь открывается из header модалки.
   */
  ADD: 2,
  LINKER: 3,
  FEEDBACK: 4,
  ACTION: 5,
} as const;

export type RightTab = (typeof RightTab)[keyof typeof RightTab];

export const RIGHT_TAB_ORDER: readonly RightTab[] = [
  RightTab.DETAILS,
  RightTab.LINKS,
  RightTab.FEEDBACK,
  RightTab.LINKER,
  RightTab.ACTION,
];