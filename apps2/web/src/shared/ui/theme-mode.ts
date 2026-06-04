/**
 * Theme-mode registry (Class 2). Single source of truth for the
 * `"light"` / `"dark"` discriminator that flows through MUI's `palette.mode`,
 * the redux slice, and the toggle button. Call sites reference
 * `ThemeMode.DARK` rather than raw string literals.
 */
export const ThemeMode = {
  LIGHT: "light",
  DARK: "dark",
} as const;
export type ThemeMode = (typeof ThemeMode)[keyof typeof ThemeMode];
