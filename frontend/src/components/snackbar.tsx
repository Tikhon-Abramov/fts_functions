import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Snackbar } from "@mui/material";



export const SNACKBAR = {
  /** How long a snackbar stays visible before auto-hiding (ms). */
  AUTO_HIDE_MS: 6_000,
  /** Shorter auto-hide duration for transient confirmations (ms). */
  AUTO_HIDE_MS_SHORT: 5_000,
  /** Max number of messages stacked at once. */
  MAX_QUEUE: 3,
  /** Anchor position on screen. */
  ANCHOR_VERTICAL: 'top' as const,
  ANCHOR_HORIZONTAL: 'center' as const,
} as const;

export const SnackbarSeverity = {
  ERROR: "error",
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
} as const;
export type Severity = (typeof SnackbarSeverity)[keyof typeof SnackbarSeverity];

type QueuedMessage = {
  id: number;
  message: string;
  severity: Severity;
};

type SnackbarContextValue = {
  showError: (message: string) => void;
  showMessage: (message: string, severity?: Severity) => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

/**
 * Single global snackbar provider. The queue displays one message at a time;
 * a new message waits for the previous one to close.
 */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<QueuedMessage | null>(null);
  const queue = useRef<QueuedMessage[]>([]);
  const idRef = useRef(0);

  const popNext = useCallback(() => {
    const next = queue.current.shift();
    setCurrent(next ?? null);
  }, []);

  const enqueue = useCallback((message: string, severity: Severity) => {
    const item: QueuedMessage = {
      id: ++idRef.current,
      message,
      severity,
    };
    setCurrent((prev) => {
      if (prev) {
        queue.current.push(item);
        return prev;
      }
      return item;
    });
  }, []);

  const value = useMemo<SnackbarContextValue>(
    () => ({
      showError: (message: string) => enqueue(message, SnackbarSeverity.ERROR),
      showMessage: (
        message: string,
        severity: Severity = SnackbarSeverity.INFO,
      ) => enqueue(message, severity),
    }),
    [enqueue],
  );

  useEffect(() => {
    setGlobalSnackbarHandler((message, severity = SnackbarSeverity.INFO) =>
      enqueue(message, severity),
    );
    return () => setGlobalSnackbarHandler(null);
  }, [enqueue]);

  const handleClose = useCallback(
    (_event: unknown, reason?: string) => {
      if (reason === "clickaway") return;
      popNext();
    },
    [popNext],
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        key={current?.id ?? "empty"}
        open={Boolean(current)}
        autoHideDuration={SNACKBAR.AUTO_HIDE_MS}
        onClose={handleClose}
        anchorOrigin={{
          vertical: SNACKBAR.ANCHOR_VERTICAL,
          horizontal: SNACKBAR.ANCHOR_HORIZONTAL,
        }}
      >
        {current ? (
          <Alert
            onClose={() => popNext()}
            severity={current.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

/**
 * Snackbar access hook. Throws if the provider is not mounted.
 */
export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return ctx;
}

/**
 * Global snackbar channel for use outside React (e.g. Redux middleware).
 * The handler is bound by the provider at mount time.
 */
type GlobalHandler = (message: string, severity?: Severity) => void;
let globalHandler: GlobalHandler | null = null;

export function setGlobalSnackbarHandler(handler: GlobalHandler | null): void {
  globalHandler = handler;
}

export function showGlobalError(message: string): void {
  globalHandler?.(message, SnackbarSeverity.ERROR);
}

export function showGlobalMessage(
  message: string,
  severity: Severity = SnackbarSeverity.INFO,
): void {
  globalHandler?.(message, severity);
}
