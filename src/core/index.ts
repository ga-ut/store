type Listener<T> = (
  prevState: StoreState<T>,
  accessedKeys: Set<keyof T>
) => void;

type StoreState<T> = {
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

export class Store<T extends object> {
  private state: StoreState<T>;
  private listeners = new Set<Listener<T>>();
  private proxyState: StoreState<T> | null = null;
  private count = 0;
  private listenerCount = 0;
  private dependencies = new Map<number, Set<keyof T>>();
  private functionDependencies = new Set<keyof T>();

  constructor(state: StoreState<T>) {
    this.state = state;

    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === 'function') {
        Object.assign(this.state, {
          [key]: this.createNotifier(this.state, value)
        });
      }
    });
  }

  getState(): StoreState<T> {
    if (!this.proxyState) {
      this.proxyState = this.createProxy();
    }

    return this.proxyState;
  }

  subscribe(render: () => void, justCount: boolean = false): () => void {
    if (justCount) {
      this.count += 1;

      return () => {
        this.count -= 1;
      };
    }

    this.listenerCount += 1;

    const currentListenerCount = this.listenerCount;
    const wrapper: Listener<T> = (prevState, accessedKeys) => {
      if (this.validateRender(prevState, accessedKeys, currentListenerCount)) {
        this.proxyState = this.createProxy();
        render();
        this.count = 0;
        this.dependencies.get(currentListenerCount)?.clear();
      }
    };
    this.listeners.add(wrapper);
    return () => {
      this.listeners.delete(wrapper);
      this.listenerCount -= 1;
    };
  }

  private getPropertyValue = <K extends keyof T>(target: T, key: K): T[K] => {
    const value = target[key];

    if (typeof value !== 'function') {
      const dependencies = this.dependencies.get(this.count);

      if (!dependencies) {
        this.dependencies.set(this.count, new Set([key]));
      } else {
        dependencies.add(key);
      }

      return value;
    }

    return value;
  };

  private createProxy() {
    return new Proxy(this.state, {
      get: (target: StoreState<T>, key) => {
        return this.getPropertyValue(target as T, key as keyof T);
      }
    });
  }

  private validateRender(
    prevState: StoreState<T>,
    accessedKeys: Set<keyof T>,
    currentCount: number
  ) {
    const dependencies = this.functionDependencies.union(
      this.dependencies.get(currentCount) ?? new Set()
    );

    if (!dependencies) {
      return false;
    }

    return Array.from(dependencies.intersection(accessedKeys)).some(
      (key) => prevState[key] !== this.state[key]
    );
  }

  private notify(prevState: StoreState<T>, accessedKeys: Set<keyof T>) {
    this.listeners.forEach((listener) => listener(prevState, accessedKeys));
  }

  private createNotifier(state: StoreState<T>, value: Function) {
    return ((...args: any[]) => {
      const prevState = { ...state };

      const accessedKeys = new Set<keyof T>();

      const proxy = new Proxy(state, {
        get(target, key) {
          accessedKeys.add(key as keyof T);
          return target[key as keyof T];
        }
      });

      const result = value.apply(proxy, args);

      if (result && accessedKeys.size > 0) {
        accessedKeys.forEach((key) => this.functionDependencies.add(key));

        return result;
      }

      this.notify(prevState, accessedKeys);
    }) as any;
  }
}
