import type { ImperativePanelGroupHandle } from "react-resizable-panels";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DETAIL_PANEL_USER_RESIZE_DEVIATION_PCT } from "src/shared/config/ui";

export type UseResizablePanelOptions = {
  /** Pixel width the right panel should default to before any user interaction. */
  defaultPx: number;
  /** localStorage key under which the user-resized percentage is persisted. */
  storageKey: string;
  /** Lower bound for the right-panel percentage. */
  minPct: number;
  /** Upper bound for the right-panel percentage. */
  maxPct: number;
  /** Initial percentage rendered before the container is measured. */
  initialPct: number;
};

export type UseResizablePanelResult = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  panelGroupRef: React.MutableRefObject<ImperativePanelGroupHandle | null>;
  rightPct: number;
  /** Forward to `<PanelGroup onLayout>`; differentiates user vs programmatic layout. */
  onLayout: (sizes: number[]) => void;
};

function readStoredPct(
  storageKey: string,
  minPct: number,
  maxPct: number,
): number | null {
  try {
    const stored = localStorage.getItem(storageKey);
    const parsed = stored ? Number(stored) : NaN;
    if (!Number.isNaN(parsed) && parsed >= minPct && parsed <= maxPct) {
      return parsed;
    }
  } catch {
    /* localStorage unavailable — non-fatal */
  }
  return null;
}

/**
 * Owns the "default-px → percentage on mount, persist user resizes" dance for
 * react-resizable-panels' right-side panel. Returns refs to wire to the panel
 * container and the panel group, plus the current percentage and an onLayout
 * handler that distinguishes programmatic from user-driven resizes.
 */
export function useResizablePanel(
  options: UseResizablePanelOptions,
): UseResizablePanelResult {
  const { defaultPx, storageKey, minPct, maxPct, initialPct } = options;

  const storedInitial = useMemo(
    () => readStoredPct(storageKey, minPct, maxPct),
    [storageKey, minPct, maxPct],
  );
  const [rightPct, setRightPct] = useState<number>(storedInitial ?? initialPct);
  const [hasUserWidth, setHasUserWidth] = useState<boolean>(
    storedInitial !== null,
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelGroupRef = useRef<ImperativePanelGroupHandle | null>(null);
  const didInitialSyncRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (hasUserWidth || didInitialSyncRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width;
    if (width <= 0) return;
    const pct = Math.max(minPct, Math.min(maxPct, (defaultPx / width) * 100));
    didInitialSyncRef.current = true;
    panelGroupRef.current?.setLayout([100 - pct, pct]);
    setRightPct(pct);
  }, [hasUserWidth, defaultPx, minPct, maxPct]);

  useEffect(() => {
    if (!hasUserWidth) return;
    try {
      localStorage.setItem(storageKey, String(rightPct));
    } catch {
      /* localStorage unavailable — non-fatal */
    }
  }, [rightPct, hasUserWidth, storageKey]);

  const onLayout = useCallback(
    (sizes: number[]) => {
      const next = sizes[1];
      if (next == null) return;
      if (
        didInitialSyncRef.current &&
        Math.abs(next - rightPct) > DETAIL_PANEL_USER_RESIZE_DEVIATION_PCT
      ) {
        setHasUserWidth(true);
      }
      setRightPct(next);
    },
    [rightPct],
  );

  return { containerRef, panelGroupRef, rightPct, onLayout };
}
