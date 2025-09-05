import { Store, StoreState } from '@ga-ut/store-core';

/**
 * Subscribe to a selector result with optional key filtering and equality.
 * Extras: debounce/throttle for simple rate limiting.
 */
export function watch<T extends object, R>(
  store: Store<T>,
  selector: (s: StoreState<T>) => R,
  onChange: (value: R, modified: Set<keyof T>) => void,
  options?: {
    keys?: (keyof T)[];
    equals?: (a: R, b: R) => boolean;
    debounceMs?: number;
    throttleMs?: number;
    fireImmediately?: boolean;
  }
) {
  const eq = options?.equals ?? Object.is;
  const keys = options?.keys;
  const debounceMs = options?.debounceMs ?? 0;
  const throttleMs = options?.throttleMs ?? 0;
  const fireImmediately = options?.fireImmediately ?? false;

  let current = selector(store.getState());
  let tHandle: any = null;
  let lastFired = 0;
  const fire = (modified: Set<keyof T>) => {
    const doFire = () => onChange(current, modified);
    const now = Date.now();
    if (throttleMs > 0 && now - lastFired < throttleMs) return;
    if (debounceMs > 0) {
      clearTimeout(tHandle);
      tHandle = setTimeout(() => {
        lastFired = Date.now();
        doFire();
      }, debounceMs);
      return;
    }
    lastFired = now;
    doFire();
  };

  if (fireImmediately) {
    onChange(current, new Set());
  }

  const unsub = store.subscribe((modified) => {
    if (keys && !keys.some((k) => modified.has(k))) return;
    const next = selector(store.getState());
    if (!eq(current, next)) {
      current = next;
      fire(modified);
    }
  });
  return () => {
    clearTimeout(tHandle);
    unsub();
  };
}

/**
 * Subscribe to explicit keys without computing a selector.
 */
export function on<T extends object>(
  store: Store<T>,
  keys: (keyof T)[],
  handler: (modified: Set<keyof T>) => void
) {
  return store.subscribe((modified) => {
    if (keys.some((k) => modified.has(k))) handler(modified);
  });
}

/**
 * Create a tiny derived view with get() and subscribe().
 * Useful for integrating with other libs (Rx, signals, etc.)
 */
export function select<T extends object, R>(
  store: Store<T>,
  selector: (s: StoreState<T>) => R,
  options?: { keys?: (keyof T)[]; equals?: (a: R, b: R) => boolean }
) {
  const eq = options?.equals ?? Object.is;
  const keys = options?.keys;
  let current = selector(store.getState());
  const subs = new Set<(v: R) => void>();
  const notify = (v: R) => subs.forEach((fn) => fn(v));
  const unsub = store.subscribe((modified) => {
    if (keys && !keys.some((k) => modified.has(k))) return;
    const next = selector(store.getState());
    if (!eq(current, next)) {
      current = next;
      notify(current);
    }
  });
  return {
    get: () => current,
    subscribe(fn: (v: R) => void) {
      subs.add(fn);
      fn(current);
      return () => subs.delete(fn);
    },
    destroy: () => unsub()
  };
}

/**
 * Minimal Observable interop (TC39-like). Does not require rxjs.
 */
export function toObservable<T extends object, R>(
  store: Store<T>,
  selector: (s: StoreState<T>) => R,
  options?: { keys?: (keyof T)[]; equals?: (a: R, b: R) => boolean }
) {
  const selected = select(store, selector, options);
  return {
    subscribe(observer: { next: (v: R) => void }) {
      return selected.subscribe((v) => observer.next(v));
    },
    getValue: selected.get
  };
}
