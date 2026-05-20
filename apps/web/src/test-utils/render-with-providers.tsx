import type { RenderOptions, RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { CustomPalette } from "src/app/App";

import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { createTheme, ThemeProvider } from "@mui/material";
import { configureStore, createSlice } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { i18n } from "src/shared/i18n";
import authReducer from "src/shared/store/authSlice";
import { ThemeMode } from "src/shared/ui/theme-mode";

/**
 * Lightweight test providers for component / hook tests.
 *
 * Mocked surfaces:
 *   - Redux store: a tiny `ui` slice (enough for selectors that read `themeMode`).
 *     The real `baseApi` reducer is intentionally omitted — tests that hit RTK
 *     Query endpoints should mock at the hook boundary (vi.mock the endpoint
 *     hook) rather than spinning up the full middleware.
 *   - i18n: real `i18next` instance from `src/shared/i18n` (single-language ru).
 *   - Theme: a minimal `createTheme` call augmented with a stub `custom`
 *     palette so components reading `theme.custom.*` don't crash.
 */

// ---------- minimal custom palette (just the keys components touch in tests) ----------
const stubPalette = {
  bgDeep: "#000",
  bgPaper: "#000",
  bgSurface: "#000",
  bgInput: "#000",
  bgSnack: "#000",
  bgMenu: "#000",
  borderMain: "#000",
  borderLight: "#000",
  borderMedium: "#888",
  borderHover: "#aaa",
  borderDivider: "#000",
  textBright: "#fff",
  textPrimary: "#fff",
  textBody: "#fff",
  textSecondary: "#888",
  textMuted: "#888",
  textDim: "#444",
  hoverOverlay: "#111",
  hoverOverlayMed: "#111",
  hoverOverlayStrong: "#111",
  chipSubtle: "#222",
  scrollThumb: "#222",
  markerGreen: "#34d399",
  markerPink: "#fb7185",
  accentBlue: "#60a5fa",
  selectedBg: "#222",
  selectedBgHover: "#333",
  selectedOutline: "#444",
  linkedBg: "#222",
  linkedOutline: "#444",
  actionLeave: { bg: "#0a0", color: "#0f0", border: "#080" },
  actionTransfer: { bg: "#00a", color: "#06f", border: "#008" },
  actionOptimize: { bg: "#a80", color: "#fb0", border: "#860" },
  actionOptTransfer: { bg: "#80a", color: "#a8f", border: "#608" },
  actionRemove: { bg: "#a08", color: "#f8a", border: "#806" },
  catMethodology: { bg: "#00a", border: "#06f", text: "#88f" },
  catAction: { bg: "#0a8", border: "#0f8", text: "#8fa" },
  catControl: { bg: "#a80", border: "#fa0", text: "#fb8" },
  catMethodologyChip: { bg: "#00a", color: "#88f" },
  catActionChip: { bg: "#0a8", color: "#8fa" },
  catControlChip: { bg: "#a80", color: "#fb8" },
  linkBadgeBg: "#0aa",
  linkBadgeColor: "#8ff",
  linkBadgeBorder: "#088",
  strategyChipBg: "#a0a",
  strategyChipColor: "#a8f",
  centralYesBg: "#00a",
  linkCountChipBg: "#00a",
  saveBtn: "#0a0",
  saveBtnHover: "#080",
  gradientFrom: "#06f",
  gradientTo: "#60f",
  gradientFromHover: "#04c",
  gradientToHover: "#40c",
  dangerHover: "#f44",
  detailBtnHover: "#011",
} satisfies CustomPalette;

const testTheme = createTheme({
  palette: { mode: "dark" },
});
// Extend with the custom palette MUI doesn't know about. The cast is the same
// pattern App.tsx uses.
(testTheme as unknown as { custom: CustomPalette }).custom = stubPalette;

// ---------- minimal store (no baseApi, no middleware) ----------
const uiSlice = createSlice({
  name: "ui",
  initialState: {
    themeMode: ThemeMode.DARK,
    rightTab: 1, // RightTab.DETAILS
  },
  reducers: {},
});

export function buildTestStore() {
  return configureStore({
    reducer: {
      ui: uiSlice.reducer,
      auth: authReducer,
    },
  });
}

export type TestStore = ReturnType<typeof buildTestStore>;

// ---------- providers wrapper ----------
export function AllProviders({
  children,
  store,
}: {
  children: ReactNode;
  store?: TestStore;
}) {
  const s = store ?? buildTestStore();
  return (
    <Provider store={s}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={testTheme}>{children}</ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions & { store?: TestStore },
): RenderResult {
  const { store, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) =>
      store === undefined ? (
        <AllProviders>{children}</AllProviders>
      ) : (
        <AllProviders store={store}>{children}</AllProviders>
      ),
    ...rest,
  });
}

export { testTheme };
