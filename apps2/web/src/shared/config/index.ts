/**
 * Centralized runtime tunables for the frontend.
 *
 * Runtime tunables live here; everything imports from this folder.
 * Update one value in one file to tune the whole app.
 *
 * Contrast with `src/shared/constants/` — that folder is for
 * frontend-specific *domain* constants (like `KIND_LABELS` mapping
 * enum codes to display labels). This folder (`config/`) is strictly
 * for numeric knobs, delays, limits, and layout settings that may
 * need tweaking for UX/performance.
 */
export * from "./debounce";
export * from "./limits";
export * from "./polling";
export * from "./snackbar";
export * from "./ui";
