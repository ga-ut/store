export type StoreState<T> = {
  readonly [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (
        this: {
          -readonly [P in keyof T as T[P] extends (...args: any[]) => any
            ? never
            : P]: T[P];
        },
        ...args: Parameters<T[K]>
      ) => Exclude<ReturnType<T[K]>, undefined>
    : T[K];
};

type Listener<T> = (modified: Set<keyof T>) => void;

export class Store<T extends object> {
  private base: StoreState<T>;
  private proxy: StoreState<T>;
  private listeners = new Set<Listener<T>>();

  constructor(initial: StoreState<T>) {
    this.base = initial;
    this.proxy = this.createProxy();
  }

  getState(): StoreState<T> {
    return this.proxy;
  }

  getRawState(): StoreState<T> {
    return this.base;
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private createProxy(): StoreState<T> {
    const self = this;
    const handler: ProxyHandler<StoreState<T>> = {
      get(target, prop, receiver) {
        const value = Reflect.get(target as object, prop, receiver);
        if (typeof value === 'function') {
          return (value as Function).bind(receiver);
        }
        return value;
      },
      set(target, prop, value, receiver) {
        const key = prop as keyof T;
        const prev = Reflect.get(target as object, prop, receiver);
        if (Object.is(prev, value)) return true;
        const ok = Reflect.set(target as object, prop, value, receiver);
        if (ok) self.notify(new Set([key]));
        return ok;
      }
    };
    return new Proxy(this.base, handler);
  }

  private notify(keys: Set<keyof T>) {
    this.listeners.forEach((l) => l(keys));
  }
}

