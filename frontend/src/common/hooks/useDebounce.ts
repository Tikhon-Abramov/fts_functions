import { useCallback, useEffect, useRef, useState } from "react";

export function useImmediateDebounce<T extends (...args: any[]) => void>(
  callback: T,
  interval: number = 200
): T {
  const timeoutRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);
  const pendingArgsRef = useRef<any[] | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const flushPending = useCallback(() => {
    if (pendingArgsRef.current !== null) {
      callbackRef.current(...pendingArgsRef.current);
      pendingArgsRef.current = null;
    }
  }, []);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current === undefined) {
        callbackRef.current(...args);
        timeoutRef.current = window.setTimeout(() => {
          flushPending();
          timeoutRef.current = undefined;
        }, interval);
      } else {
        pendingArgsRef.current = args;
        clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          flushPending();
          timeoutRef.current = undefined;
        }, interval);
      }
    },
    [interval, flushPending]
  ) as T;
}

export function useDebounce(callback: (...args: any[]) => void, interval: number = 200) {
  const timeoutRef = useRef<number | undefined>(undefined);

  return useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callback(...args);
      }, interval);
    },
    [callback, interval]
  );
}

export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
