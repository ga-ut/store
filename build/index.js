"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Store: () => Store,
  useStore: () => useStore
});
module.exports = __toCommonJS(src_exports);

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
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
};

// src/react/index.ts
var import_react = require("react");
function useStore(store) {
  (0, import_react.useSyncExternalStore)(
    (listener) => store.subscribe(listener),
    () => store.state,
    () => store.state
  );
}
