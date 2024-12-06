import { useEffect, useSyncExternalStore } from 'react';
import { Store } from '../core/index';

export function useStore<T extends object>(store: Store<T>) {
  const unsubscribe = store.subscribe(() => {}, true);

  useEffect(() => {
    return unsubscribe;
  }, []);

  useSyncExternalStore(
    (render) => store.subscribe(render),
    () => store.getState(),
    () => store.getState()
  );

  return store.getState() as T;
}
