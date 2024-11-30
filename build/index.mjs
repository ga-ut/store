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
        this.state[key] = this.createNotifier(value);
      }
    });
  }
  notify() {
    this.listeners.forEach((listener) => listener());
  }
  createNotifier(value) {
    return (...args) => {
      const prevState = { ...this.state };
      const result = value.apply(this.state, args);
      const isEqual = this.shallowCompare(prevState, this.state);
      if (!isEqual) {
        this.state = { ...this.state };
        this.notify();
      }
      return result;
    };
  }
  shallowCompare(prevState, state) {
    const prevStateKeys = Object.keys(prevState);
    const stateKeys = Object.keys(state);
    if (prevStateKeys.length !== stateKeys.length) {
      return false;
    }
    for (const key of prevStateKeys) {
      if (prevState[key] !== state[key]) {
        return false;
      }
    }
    return true;
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
};

// src/react/index.ts
import { useSyncExternalStore } from "react";
var useStore = (store) => {
  useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state
  );
};
export {
  Store,
  useStore
};
