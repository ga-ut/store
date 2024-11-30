import { useSyncExternalStore } from 'react';
import { Store } from '../core/index';

export const useStore = <T extends object>(store: Store<T>) => {
  useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state
  );
};
