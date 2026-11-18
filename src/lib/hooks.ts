import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeNoop = () => () => {};

export function useMounted() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
