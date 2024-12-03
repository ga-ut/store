import { useSyncExternalStore } from 'react';
import { Store } from '../core/index';

type ReturnType<T, K> = K extends (keyof T)[] ? Pick<T, K[number]> : T;

export function useStore<T extends object, K extends (keyof T)[]>(
  store: Store<T>,
  keys?: K
): ReturnType<T, K> {
  useSyncExternalStore(
    (render) => store.subscribe(render, keys as (keyof T)[]),
    () => store.state,
    () => store.state
  );

  if (keys === undefined) {
    return store.state as ReturnType<T, K>;
  }

  return keys.reduce((obj, key) => {
    return { ...obj, [key]: store.state[key] };
  }, {}) as ReturnType<T, K>;
}
