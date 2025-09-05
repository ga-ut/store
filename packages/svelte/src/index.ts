import type { StoreState } from '@ga-ut/store-core';
import { Store } from '@ga-ut/store-core';

export function toReadable<T extends object, R>(
  store: Store<T>,
  selector: (s: StoreState<T>) => R,
  options?: { keys?: (keyof T)[]; equals?: (a: R, b: R) => boolean }
) {
  return {
    subscribe(run: (value: R) => void) {
      const eq = options?.equals ?? Object.is;
      const keys = options?.keys;
      let current = selector(store.getState());
      run(current);
      const unsub = store.subscribe((modified) => {
        if (keys && !keys.some((k) => modified.has(k))) return;
        const next = selector(store.getState());
        if (!eq(current, next)) {
          current = next;
          run(next);
        }
      });
      return unsub;
    }
  };
}

export const select = toReadable;

export function bindMethods<T extends object>(store: Store<T>) {
  const raw = store.getRawState() as any;
  const bound: Record<string, any> = {};
  for (const k of Object.keys(raw)) {
    const v = raw[k];
    if (typeof v === 'function') bound[k] = (v as Function).bind(store.getState());
  }
  return bound as { [K in keyof T as T[K] extends (...a: any) => any ? K : never]: T[K] };
}
