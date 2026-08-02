import { useCallback, useSyncExternalStore } from "react";

export const MAX_COMPARE = 6;
const KEY = "cartsense:compare";

let ids: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  ids = read();
}

function commit(next: string[]) {
  ids = next.slice(0, MAX_COMPARE);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — keep in-memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      ids = read();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: string[] = [];
const getSnapshot = () => (hydrated ? ids : EMPTY);
const getServerSnapshot = () => EMPTY;

export function useCompare() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((id: string) => {
    if (ids.includes(id) || ids.length >= MAX_COMPARE) return false;
    commit([...ids, id]);
    return true;
  }, []);

  const remove = useCallback((id: string) => commit(ids.filter((x) => x !== id)), []);

  const toggle = useCallback((id: string) => {
    if (ids.includes(id)) {
      commit(ids.filter((x) => x !== id));
      return false;
    }
    if (ids.length >= MAX_COMPARE) return false;
    commit([...ids, id]);
    return true;
  }, []);

  const clear = useCallback(() => commit([]), []);

  return {
    ids: list,
    count: list.length,
    isFull: list.length >= MAX_COMPARE,
    has: (id: string) => list.includes(id),
    add,
    remove,
    toggle,
    clear,
    max: MAX_COMPARE,
  };
}
