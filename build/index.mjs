var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/core/index.ts
var Store = class {
  constructor(state) {
    this.state = state;
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === "function") {
        Object.assign(this.state, { [key]: this.createNotifier(value) });
      }
    });
  }
  subscribe(render, keys) {
    const wrapper = (prevState, currentState) => {
      if (!this.compareFromKeys(keys, prevState, currentState)) {
        this.state = { ...currentState };
        render();
      }
    };
    this.listeners.add(wrapper);
    return () => this.listeners.delete(wrapper);
  }
  compareFromKeys(keys, prevState, currentState) {
    if (!(keys == null ? void 0 : keys.length)) {
      return false;
    }
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (prevState[key] !== currentState[key]) {
        return false;
      }
    }
    return true;
  }
  notify(prevState, currentState) {
    this.listeners.forEach((listener) => listener(prevState, currentState));
  }
  createNotifier(value) {
    return (...args) => {
      const prevState = { ...this.state };
      const result = value.apply(this.state, args);
      this.notify(prevState, this.state);
      return result;
    };
  }
};

// src/react/index.ts
import { useSyncExternalStore } from "react";
function useStore(store, key) {
  useSyncExternalStore(
    (render) => store.subscribe(render, key),
    () => store.state,
    () => store.state
  );
}
export {
  Store,
  useStore
};
