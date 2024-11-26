// src/react/useStore.ts
import { useSyncExternalStore } from "react";
var useStore = (store) => {
  useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state
  );
};
export {
  useStore
};
