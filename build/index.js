var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/index.ts
var Store = class {
  constructor(params) {
    __publicField(this, "state");
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "notify", () => {
      this.listeners.forEach((listener) => listener());
    });
    __publicField(this, "subscribe", (listener) => {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    });
    __publicField(this, "setState", (fn) => {
      const prevSnapshot = this.state;
      this.state = {
        ...prevSnapshot,
        ...fn(this.state)
      };
      this.notify();
    });
    this.state = params;
  }
};
export {
  Store
};
