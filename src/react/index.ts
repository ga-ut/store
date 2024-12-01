import { useSyncExternalStore } from 'react';
import { Store } from '../core/index';

export function useStore<T extends object>(store: Store<T>, key?: (keyof T)[]) {
  useSyncExternalStore(
    (render) => store.subscribe(render, key),
    () => store.state,
    () => store.state
  );
}
