import { useEffect, useId, useMemo, useSyncExternalStore } from 'react';
import { Store } from '../core/index';

export function useStore<T extends object>(store: Store<T>) {
  const id = useId();

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {}, id, true);
    return unsubscribe;
  }, []);

  return useSyncExternalStore(
    (render) => store.subscribe(render, id),
    () => store.getState(id),
    () => store.getState(id)
  ) as T;
}
