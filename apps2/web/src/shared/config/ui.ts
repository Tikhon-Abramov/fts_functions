/**
 * DataGrid row/head heights used across list and modal tables.
 * `ROW_HEIGHT` is the *estimated* height for virtualization — real heights
 * are content-driven via `getRowHeight={() => "auto"}`. Lower → denser.
 */
export const ROW_HEIGHT = 44;
export const HEAD_HEIGHT = 36;
export const STEP_TITLE_HEIGHT = 36;
export const CATEGORY_ROW_HEIGHT = 40;

/** DataGrid pinned + default column widths. */
export const TABLE_PIN_W_NUM = 44;
export const TABLE_PIN_W_ACT = 80;
export const TABLE_COL_W = 140;

/** 4-digit captcha required to confirm destructive delete. */
export const DELETE_CAPTCHA = "9967";

/** Max items allowed per detail category (client-side hint). */
export const MAX_PER_CATEGORY = 5;

/** Default px width for the resizable right-side detail panel. */
export const DETAIL_RIGHT_PANEL_DEFAULT_PX = 340;
/** Lower bound for the right-panel width as a percentage of the viewport. */
export const DETAIL_RIGHT_PANEL_MIN_PCT = 25;
/** Upper bound for the right-panel width as a percentage of the viewport. */
export const DETAIL_RIGHT_PANEL_MAX_PCT = 60;
/** Initial percentage used before the layout has been measured. */
export const DETAIL_RIGHT_PANEL_INITIAL_PCT = 30;
/** Lower bound for the LEFT step-grid panel as a percentage. */
export const DETAIL_LEFT_PANEL_MIN_PCT = 40;
/** Layout-deviation threshold (%) above which a panel resize is treated as user-driven. */
export const DETAIL_PANEL_USER_RESIZE_DEVIATION_PCT = 0.5;
/** Min container width before the right panel collapses scrolling (px). */
export const DETAIL_RIGHT_PANEL_MIN_PX = 320;
/** localStorage key for the persisted right-panel width. */
export const DETAIL_PANEL_WIDTH_STORAGE_KEY = "fts-details-panel-width";
