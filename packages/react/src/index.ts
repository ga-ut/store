import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Store } from '@ga-ut/store-core';

export function useStore<T extends object>(store: Store<T>) {
  const [, setTick] = useState({});
  const render = useMemo(() => () => setTick({}), []);

  const depsRef = useRef<Set<keyof T>>(new Set());
  const collectingRef = useRef(false);
  const unsubRef = useRef<null | (() => void)>(null);

  useLayoutEffect(() => {
    const hasDeps = depsRef.current.size > 0;
    if (!hasDeps) {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      return;
    }
    if (!unsubRef.current) {
      const unsubscribe = store.subscribe((modified) => {
        const deps = depsRef.current;
        for (const k of modified) {
          if (deps.has(k as keyof T)) {
            render();
            break;
          }
        }
      });
      unsubRef.current = unsubscribe;
    }
  }, [store, render]);

  depsRef.current.clear();
  collectingRef.current = true;
  useLayoutEffect(() => {
    collectingRef.current = false;
  });

  const proxy = useMemo(() => {
    const base = store.getState() as any;
    const raw = store.getRawState() as any;
    const boundCache = new Map<PropertyKey, Function>();
    const handler: ProxyHandler<any> = {
      get(_t, prop) {
        const value = base[prop as any];
        if (collectingRef.current) {
          if (typeof prop === 'string' || typeof prop === 'symbol') {
            if (typeof value !== 'function') {
              depsRef.current.add(prop as keyof T);
            }
          }
        }
        if (typeof value === 'function') {
          const cached = boundCache.get(prop);
          if (cached) return cached;
          const fn = raw[prop as any] as Function;
          const bound = fn.bind(proxyRef.current);
          boundCache.set(prop, bound);
          return bound;
        }
        return value;
      },
      set(_t, prop, val) {
        return Reflect.set(base, prop as any, val);
      }
    };
    return new Proxy(base, handler);
  }, [store]);

  const proxyRef = useRef<any>(proxy);
  proxyRef.current = proxy;

  useLayoutEffect(() => () => {
    if (unsubRef.current) unsubRef.current();
  }, []);

  return proxy as T;
}

