export const STORAGE_KEY = "foodcostlab-tutorial-step";
export const RESTART_EVENT = "foodcostlab:restart-tutorial";
const CHANGE_EVENT = "foodcostlab:tutorial-change";
let memoryValue: string | null = null;
let memoryOnly = false;

/** Undefined keeps server HTML and the first hydration render identical. */
export const getServerSnapshot = (): undefined => undefined;

export function getSnapshot(): string | null {
  if (memoryOnly) return memoryValue;
  try { return window.localStorage.getItem(STORAGE_KEY); }
  catch { return memoryValue; }
}

export function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

export function saveStep(value: number | "done") {
  memoryValue = String(value);
  try { window.localStorage.setItem(STORAGE_KEY, memoryValue); }
  catch { memoryOnly = true; }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resolveStep(raw: string | null | undefined, count: number, pathname: string): number | null {
  if (raw === undefined || raw === "done") return null;
  if (raw !== null && /^(0|[1-9]\d*)$/.test(raw)) {
    const index = Number(raw);
    if (Number.isSafeInteger(index) && index < count) return index;
  }
  return pathname === "/dashboard" ? 0 : null;
}
