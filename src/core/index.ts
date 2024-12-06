type Listener<T> = (
  prevState: StoreState<T>,
  modifiedKeys: Set<keyof T>
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

type Dependencies<T> = Set<keyof T>;

export class Store<T extends object> {
  private state: StoreState<T>;
  private listeners = new Set<Listener<T>>();
  private proxyState: StoreState<T> | null = null;
  private subscriptionCount = 0;
  private listenerCount = 0;
  private subscriptionDependencies = new Map<number, Dependencies<T>>();
  private methodDependencies = new Set<keyof T>();

  constructor(state: StoreState<T>) {
    this.state = state;
    this.initializeMethods();
  }

  getState(): StoreState<T> {
    if (!this.proxyState) {
      this.proxyState = this.createStateProxy();
    }
    return this.proxyState;
  }

  subscribe(render: () => void, trackOnly: boolean = false): () => void {
    if (trackOnly) {
      this.subscriptionCount += 1;
      return () => {
        this.subscriptionCount -= 1;
      };
    }

    const listenerId = ++this.listenerCount;
    const listener: Listener<T> = (prevState, modifiedKeys) => {
      if (this.shouldComponentUpdate(prevState, modifiedKeys, listenerId)) {
        this.proxyState = this.createStateProxy();
        render();
        this.resetSubscriptionTracking(listenerId);
      }
    };

    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      this.listenerCount -= 1;
    };
  }

  private initializeMethods(): void {
    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === 'function') {
        Object.assign(this.state, {
          [key]: this.createMethodProxy(value)
        });
      }
    });
  }

  private trackPropertyAccess(key: keyof T): void {
    const dependencies = this.subscriptionDependencies.get(
      this.subscriptionCount
    );
    if (!dependencies) {
      this.subscriptionDependencies.set(this.subscriptionCount, new Set([key]));
    } else {
      dependencies.add(key);
    }
  }

  private createStateProxy(): StoreState<T> {
    return new Proxy(this.state, {
      get: (target: StoreState<T>, key) => {
        const value = target[key as keyof T];
        if (typeof value !== 'function') {
          this.trackPropertyAccess(key as keyof T);
        }
        return value;
      }
    });
  }

  private shouldComponentUpdate(
    prevState: StoreState<T>,
    modifiedKeys: Set<keyof T>,
    listenerId: number
  ): boolean {
    const allDependencies = this.methodDependencies.union(
      this.subscriptionDependencies.get(listenerId) ?? new Set()
    );

    if (!allDependencies.size) return false;

    return Array.from(allDependencies.intersection(modifiedKeys)).some(
      (key) => prevState[key] !== this.state[key]
    );
  }

  private resetSubscriptionTracking(listenerId: number): void {
    this.subscriptionCount = 0;
    this.subscriptionDependencies.get(listenerId)?.clear();
  }

  private notifyListeners(
    prevState: StoreState<T>,
    modifiedKeys: Set<keyof T>
  ): void {
    this.listeners.forEach((listener) => listener(prevState, modifiedKeys));
  }

  private createMethodProxy(method: Function) {
    return ((...args: any[]) => {
      const prevState = { ...this.state };
      const modifiedKeys = new Set<keyof T>();

      const stateTracker = new Proxy(this.state, {
        get: (target, key) => {
          modifiedKeys.add(key as keyof T);
          return target[key as keyof T];
        },
        set: (target, key, value) => {
          Object.assign(target, { [key]: value });
          modifiedKeys.add(key as keyof T);
          return true;
        }
      });

      const result = method.apply(stateTracker, args);

      if (result && modifiedKeys.size > 0) {
        modifiedKeys.forEach((key) => this.methodDependencies.add(key));
        return result;
      }

      this.notifyListeners(prevState, modifiedKeys);
    }) as any;
  }
}
