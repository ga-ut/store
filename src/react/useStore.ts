import { useSyncExternalStore } from 'react';
import { Store } from 'src';

export const useStore = <T>(store: Store<T>) => {
  useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state
  );
};
