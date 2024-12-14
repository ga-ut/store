import { useEffect, useId, useMemo, useSyncExternalStore } from 'react';
import { Store } from '../core/index';

export function useStore<T extends object>(store: Store<T>) {
  const id = useId();
  const unsubscribe = useMemo(() => store.subscribe(() => {}, id, true), []);

  useEffect(() => {
    return unsubscribe;
  }, []);

  useSyncExternalStore(
    (render) => store.subscribe(render, id),
    () => store.getState(id),
    () => store.getState(id)
  );

  return store.getState(id) as T;
}
