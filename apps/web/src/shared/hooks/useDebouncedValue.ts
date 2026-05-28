import { useEffect, useState } from "react";

/**
 * Returns a value that only updates after `delayMs` of stability. Useful for
 * debouncing search inputs so every keystroke does not kick off a backend
 * request.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
