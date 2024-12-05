import { useSyncExternalStore } from 'react';
import { Store } from '../core/index';

export function useStore<T extends object>(store: Store<T>) {
  useSyncExternalStore(
    (render) => store.subscribe(render),
    () => store.state,
    () => store.state
  );

  return store.state as T;
}
