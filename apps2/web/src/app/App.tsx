import { useEffect, useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import {
  Box,
  CircularProgress,
  createTheme,
  CssBaseline,
  ThemeProvider,
} from "@mui/material";
import { PersistGate } from "redux-persist/integration/react";
import Home from "src/pages/home";
import NotFound from "src/pages/not-found";
import { i18n } from "src/shared/i18n";
import { persistor, store, useAppSelector } from "src/shared/store";
import { selectThemeMode } from "src/shared/store/uiSlice";
import { SnackbarProvider } from "src/shared/ui/snackbar";
import { ThemeMode } from "src/shared/ui/theme-mode";
import { Route, Router as WouterRouter, Switch } from "wouter";

// Match Vite's `base` so wouter's `useLocation` returns paths relative
// to the deploy prefix. In dev (no base), it's `""` and wouter behaves as
// before. In prod the SPA is served from `/dev/19/`.
const ROUTER_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const customPalette = {
  dark: {
    // Surfaces — slate family with slight blue saturation. Operational/trustworthy
    // voice for data-dense UI; stays "fresh" under heavy table content.
    bgDeep: "#0b1220", // page background — deep slate
    bgPaper: "#111827", // card / dialog — slate-900
    bgSurface: "#1e293b", // elevated surface — slate-800
    bgInput: "#1e293b",
    bgSnack: "#1e293b",
    bgMenu: "#111827",
    borderMain: "#1e293b", // slate-800
    borderLight: "#111827",
    borderMedium: "#334155", // slate-700 stronger
    borderHover: "#475569", // slate-600 hover
    borderDivider: "rgba(255,255,255,0.10)",
    textBright: "#f8fafc", // slate-50
    textPrimary: "#e2e8f0", // slate-200
    textBody: "#cbd5e1", // slate-300
    textSecondary: "#94a3b8", // slate-400
    textMuted: "#64748b", // slate-500
    textDim: "#475569", // slate-600
    hoverOverlay: "rgba(255,255,255,0.02)",
    hoverOverlayMed: "rgba(255,255,255,0.03)",
    hoverOverlayStrong: "rgba(255,255,255,0.04)",
    chipSubtle: "rgba(255,255,255,0.05)",
    scrollThumb: "#334155",
    markerGreen: "#34d399",
    markerPink: "#fb7185",
    accentBlue: "#60a5fa", // sky-400 — fresher than royal blue, operational
    selectedBg: "rgba(34,197,94,0.20)",
    selectedBgHover: "rgba(34,197,94,0.28)",
    selectedOutline: "rgba(34,197,94,0.65)",
    linkedBg: "rgba(56,189,248,0.18)",
    linkedOutline: "rgba(56,189,248,0.55)",
    actionLeave: {
      bg: "rgba(16,185,129,0.15)",
      color: "#34d399",
      border: "rgba(16,185,129,0.3)",
    },
    actionTransfer: {
      bg: "rgba(59,130,246,0.15)",
      color: "#60a5fa",
      border: "rgba(59,130,246,0.3)",
    },
    actionOptimize: {
      bg: "rgba(245,158,11,0.15)",
      color: "#fbbf24",
      border: "rgba(245,158,11,0.3)",
    },
    actionOptTransfer: {
      bg: "rgba(139,92,246,0.15)",
      color: "#a78bfa",
      border: "rgba(139,92,246,0.3)",
    },
    actionRemove: {
      bg: "rgba(234,67,161,0.15)",
      color: "#fa8be8",
      border: "rgba(190,92,246,0.3)",
    },
    catMethodology: {
      bg: "rgba(99,102,241,0.08)",
      border: "#6366f1",
      text: "#818cf8",
    },
    catAction: {
      bg: "rgba(20,184,166,0.08)",
      border: "#14b8a6",
      text: "#2dd4bf",
    },
    catControl: {
      bg: "rgba(245,158,11,0.08)",
      border: "#f59e0b",
      text: "#fbbf24",
    },
    catMethodologyChip: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
    catActionChip: { bg: "rgba(20,184,166,0.15)", color: "#2dd4bf" },
    catControlChip: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    linkBadgeBg: "rgba(56,189,248,0.12)",
    linkBadgeColor: "#7dd3fc",
    linkBadgeBorder: "rgba(56,189,248,0.25)",
    strategyChipBg: "rgba(99,102,241,0.12)",
    strategyChipColor: "#a78bfa",
    centralYesBg: "rgba(59,130,246,0.12)",
    linkCountChipBg: "rgba(59,130,246,0.1)",
    saveBtn: "#22c55e",
    saveBtnHover: "#16a34a",
    gradientFrom: "#3b82f6",
    gradientTo: "#6366f1",
    gradientFromHover: "#2563eb",
    gradientToHover: "#4f46e5",
    dangerHover: "#ef4444",
    detailBtnHover: "rgba(96,165,250,0.08)",
  },
  light: {
    bgDeep: "#f0f4f8",
    bgPaper: "#ffffff",
    bgSurface: "#f8fafc",
    bgInput: "#f1f5f9",
    bgSnack: "#1e293b",
    bgMenu: "#ffffff",
    borderMain: "#e2e8f0",
    borderLight: "#f1f5f9",
    borderMedium: "#cbd5e1",
    borderHover: "#94a3b8",
    borderDivider: "rgba(0,0,0,0.15)",
    textBright: "#0f172a",
    textPrimary: "#1e293b",
    textBody: "#334155",
    textSecondary: "#64748b",
    textMuted: "#94a3b8",
    textDim: "#94a3b8",
    hoverOverlay: "rgba(0,0,0,0.02)",
    hoverOverlayMed: "rgba(0,0,0,0.03)",
    hoverOverlayStrong: "rgba(0,0,0,0.04)",
    chipSubtle: "rgba(0,0,0,0.05)",
    scrollThumb: "#cbd5e1",
    markerGreen: "#16a34a",
    markerPink: "#e11d48",
    accentBlue: "#3b82f6",
    selectedBg: "rgba(22,163,74,0.18)",
    selectedBgHover: "rgba(22,163,74,0.26)",
    selectedOutline: "rgba(22,163,74,0.6)",
    linkedBg: "rgba(56,189,248,0.18)",
    linkedOutline: "rgba(56,189,248,0.55)",
    actionLeave: {
      bg: "rgba(16,185,129,0.1)",
      color: "#059669",
      border: "rgba(16,185,129,0.25)",
    },
    actionTransfer: {
      bg: "rgba(59,130,246,0.1)",
      color: "#2563eb",
      border: "rgba(59,130,246,0.25)",
    },
    actionOptimize: {
      bg: "rgba(245,158,11,0.1)",
      color: "#d97706",
      border: "rgba(245,158,11,0.25)",
    },
    actionOptTransfer: {
      bg: "rgba(139,92,246,0.1)",
      color: "#7c3aed",
      border: "rgba(139,92,246,0.25)",
    },
    actionRemove: {
      bg: "rgba(234,67,161,0.15)",
      color: "#bf4bad",
      border: "rgba(190,92,246,0.3)",
    },
    catMethodology: {
      bg: "rgba(99,102,241,0.06)",
      border: "#6366f1",
      text: "#4f46e5",
    },
    catAction: {
      bg: "rgba(20,184,166,0.06)",
      border: "#14b8a6",
      text: "#0d9488",
    },
    catControl: {
      bg: "rgba(245,158,11,0.06)",
      border: "#f59e0b",
      text: "#d97706",
    },
    catMethodologyChip: { bg: "rgba(99,102,241,0.1)", color: "#4f46e5" },
    catActionChip: { bg: "rgba(20,184,166,0.1)", color: "#0d9488" },
    catControlChip: { bg: "rgba(245,158,11,0.1)", color: "#d97706" },
    linkBadgeBg: "rgba(56,189,248,0.1)",
    linkBadgeColor: "#0284c7",
    linkBadgeBorder: "rgba(56,189,248,0.2)",
    strategyChipBg: "rgba(99,102,241,0.1)",
    strategyChipColor: "#6366f1",
    centralYesBg: "rgba(59,130,246,0.1)",
    linkCountChipBg: "rgba(59,130,246,0.08)",
    saveBtn: "#16a34a",
    saveBtnHover: "#15803d",
    gradientFrom: "#3b82f6",
    gradientTo: "#6366f1",
    gradientFromHover: "#2563eb",
    gradientToHover: "#4f46e5",
    dangerHover: "#dc2626",
    detailBtnHover: "rgba(59,130,246,0.06)",
  },
};

export type CustomPalette = typeof customPalette.dark;

function buildTheme(mode: ThemeMode) {
  const c = customPalette[mode];
  return createTheme({
    palette: {
      mode,
      background: {
        default: c.bgDeep,
        paper: c.bgPaper,
      },
      primary: {
        main: "#60a5fa", // sky-400 — fresh operational blue
        light: "#93c5fd",
        dark: "#3b82f6",
      },
      success: {
        main: "#10b981",
        light: "#34d399",
        dark: "#059669",
      },
      text: {
        primary: c.textPrimary,
        secondary: c.textSecondary,
      },
      divider: c.borderMain,
    },
    typography: {
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
      // Default TextField size to "small" everywhere for compact, registry-
      // form-compatible heights (auth pages, profile pages, dialogs). Pages
      // that explicitly need medium can override with size="medium".
      MuiTextField: { defaultProps: { size: "small" } },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: c.bgDeep,
            scrollbarWidth: "thin",
            scrollbarColor: `${c.scrollThumb} transparent`,
            "&::-webkit-scrollbar": { width: 6 },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: c.scrollThumb,
              borderRadius: 3,
            },
          },
          "*::-webkit-scrollbar": { width: 6, height: 6 },
          "*::-webkit-scrollbar-track": { background: "transparent" },
          "*::-webkit-scrollbar-thumb": {
            background: c.scrollThumb,
            borderRadius: 3,
          },
          // DataGrid column menu — denser typography + tighter padding so
          // the popup doesn't dwarf the table. Targets the popper Paper
          // (rendered outside the grid root, hence not reachable from
          // `registryGridSx`).
          ".MuiDataGrid-menu .MuiPaper-root": {
            backgroundColor: c.bgMenu,
            color: c.textBody,
            border: `1px solid ${c.borderMain}`,
            borderRadius: 6,
            minWidth: 200,
          },
          ".MuiDataGrid-menu .MuiMenuItem-root, .MuiDataGrid-menu .MuiListItem-root":
            {
              fontSize: "0.78rem",
              minHeight: 30,
              paddingTop: "4px",
              paddingBottom: "4px",
              paddingLeft: "12px",
              paddingRight: "12px",
            },
          ".MuiDataGrid-menu .MuiListItemIcon-root": {
            minWidth: 0,
            color: c.textMuted,
            marginRight: "10px",
          },
          ".MuiDataGrid-menu .MuiListItemIcon-root svg": { fontSize: 18 },
          ".MuiDataGrid-menu .MuiTypography-root": { fontSize: "0.78rem" },
          ".MuiDataGrid-menu .MuiDivider-root": {
            marginTop: 4,
            marginBottom: 4,
            borderColor: c.borderLight,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: c.bgMenu,
            color: c.textBody,
            border: `1px solid ${c.borderMain}`,
            boxShadow:
              mode === ThemeMode.DARK
                ? "0 4px 16px rgba(0,0,0,0.4)"
                : "0 4px 16px rgba(0,0,0,0.1)",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: c.textBody,
            "&:hover": { backgroundColor: c.hoverOverlayStrong },
            "&.Mui-selected": {
              backgroundColor: c.selectedBg,
              "&:hover": { backgroundColor: c.selectedBgHover },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: { color: c.textMuted },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: c.textBody,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: c.borderMedium,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: c.borderHover,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: c.textMuted },
        },
      },
    },
    custom: c,
  });
}

// MUI Theme augmentation. Declaration merging requires `interface`, not
// `type` — the documented Class 28 exception (see docs/patterns.md).
/* eslint-disable @typescript-eslint/consistent-type-definitions */
declare module "@mui/material/styles" {
  interface Theme {
    custom: typeof customPalette.dark;
  }
  interface ThemeOptions {
    custom?: typeof customPalette.dark;
  }
}
/* eslint-enable @typescript-eslint/consistent-type-definitions */

function Router() {
  return (
    <WouterRouter base={ROUTER_BASE}>
      <RouterRoutes />
    </WouterRouter>
  );
}

function RouterRoutes() {
  return (
    <Switch>
      {/*<Route path="/login" component={Login} />*/}
      {/*<Route path="/register" component={Register} />*/}
      {/*<Route path="/verify-email" component={VerifyEmail} />*/}
      {/*<Route path="/forgot-password" component={ForgotPassword} />*/}
      {/*<Route path="/reset-password" component={ResetPassword} />*/}
      {/* Protected routes — RequireAuth gates everything below it. */}
      {/*<Route path="/profile">*/}
      {/*  <RequireAuth>*/}
      {/*    <Profile />*/}
      {/*  </RequireAuth>*/}
      {/*</Route>*/}
      {/*<Route path="/admin/types">*/}
      {/*  <RequireAdmin>*/}
      {/*    <AdminTypesList />*/}
      {/*  </RequireAdmin>*/}
      {/*</Route>*/}
      {/*<Route path="/admin/users">*/}
      {/*  <RequireAdmin>*/}
      {/*    <AdminUsersList />*/}
      {/*  </RequireAdmin>*/}
      {/*</Route>*/}
      {/*<Route path="/admin">*/}
      {/*  <RequireAdmin>*/}
      {/*    <AdminDashboard />*/}
      {/*  </RequireAdmin>*/}
      {/*</Route>*/}
      {/* FTS-NO-AUTH BRANCH: home is public, no RequireAuth gate */}
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemedApp() {
  const mode = useAppSelector(selectThemeMode);
  const theme = useMemo(() => buildTheme(mode), [mode]);

  // Mirror theme mode onto <html> so shadcn HSL tokens (.dark block) take effect.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === ThemeMode.DARK);
    root.classList.toggle("light", mode === ThemeMode.LIGHT);
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router />
    </ThemeProvider>
  );
}

/**
 * Spinner shown during the brief tick between mount and redux-persist
 * rehydrating localStorage into the store. Mirrors the `<RequireAuth>`
 * loading state visually so the page never flashes a wrong theme/empty
 * registry.
 */
function PersistGateSpinner() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      data-testid="persist-gate-spinner"
    >
      <CircularProgress />
    </Box>
  );
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<PersistGateSpinner />} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <SnackbarProvider>
            <ThemedApp />
          </SnackbarProvider>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
