import type { StoreState } from '@ga-ut/store-core';
import { Store } from '@ga-ut/store-core';

type Ref<T> = { value: T };

export function toRef<T extends object, R>(
  store: Store<T>,
  selector: (s: StoreState<T>) => R,
  makeRef: <V>(v: V) => Ref<V> = (v) => ({ value: v }),
  options?: { keys?: (keyof T)[]; equals?: (a: R, b: R) => boolean }
) {
  const eq = options?.equals ?? Object.is;
  const keys = options?.keys;
  const ref = makeRef(selector(store.getState()));
  const unsub = store.subscribe((modified) => {
    if (keys && !keys.some((k) => modified.has(k))) return;
    const next = selector(store.getState());
    if (!eq(ref.value, next)) ref.value = next;
  });
  return { ref, unsubscribe: unsub };
}

// Select multiple pieces into a single ref
export function select<T extends object, A extends any[]>(
  store: Store<T>,
  selectors: { [K in keyof A]: (s: StoreState<T>) => A[K] },
  makeRef: <V>(v: V) => Ref<V>,
  options?: { keys?: (keyof T)[]; equals?: (a: A, b: A) => boolean }
) {
  const eq = options?.equals ?? ((a: A, b: A) => a.length === b.length && a.every((v, i) => Object.is(v, b[i])));
  const getAll = () => selectors.map((fn) => fn(store.getState())) as A;
  const r = makeRef(getAll());
  const unsub = store.subscribe((modified) => {
    if (options?.keys && !options.keys.some((k) => modified.has(k))) return;
    const next = getAll();
    if (!eq(r.value, next)) r.value = next;
  });
  return { ref: r, unsubscribe: unsub };
}

// Bind only methods (actions) for easy usage in setup()
export function bindMethods<T extends object>(store: Store<T>) {
  const raw = store.getRawState() as any;
  const bound: Record<string, any> = {};
  for (const k of Object.keys(raw)) {
    const v = raw[k];
    if (typeof v === 'function') bound[k] = (v as Function).bind(store.getState());
  }
  return bound as { [K in keyof T as T[K] extends (...a: any) => any ? K : never]: T[K] };
}
