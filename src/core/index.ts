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
  private proxyStateMap = new Map<string, StoreState<T>>();
  private cachedDependencies = new Map<string, Dependencies<T>>();
  private subscriptionDependencies = new Map<string, Dependencies<T>>();
  private methodDependencies = new Set<keyof T>();

  constructor(state: StoreState<T>) {
    this.state = state;
    this.initializeMethods();
  }

  getState(id: string = ''): T {
    if (!this.proxyStateMap.has(id)) {
      this.proxyStateMap.set(id, this.createStateProxy(id));
    }
    return this.proxyStateMap.get(id)! as T;
  }

  subscribe(
    render: () => void,
    id: string,
    trackOnly: boolean = false
  ): () => void {
    if (trackOnly) {
      const dependencies = this.cachedDependencies.get(id);
      if (dependencies) {
        this.subscriptionDependencies.set(id, dependencies);
      }
      return () => {
        this.subscriptionDependencies.delete(id);
      };
    }

    const listener: Listener<T> = (prevState, modifiedKeys) => {
      if (this.shouldComponentUpdate(prevState, modifiedKeys, id)) {
        this.proxyStateMap.set(id, this.createStateProxy(id));
        render();
        this.optimizedCache();
      }
    };

    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private optimizedCache(): void {
    this.cachedDependencies.clear();
    const entries = this.subscriptionDependencies.entries();

    for (const [id, dependencies] of entries) {
      this.cachedDependencies.set(id, dependencies);
    }
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

  private trackPropertyAccess(key: keyof T, id: string): void {
    const dependencies = this.subscriptionDependencies.get(id);
    if (!dependencies) {
      this.subscriptionDependencies.set(id, new Set([key]));
    } else {
      dependencies.add(key);
    }

    const cachedDependencies = this.cachedDependencies.get(id);
    if (!cachedDependencies) {
      this.cachedDependencies.set(id, new Set([key]));
    } else {
      cachedDependencies.add(key);
    }
  }

  private createStateProxy(id: string): StoreState<T> {
    return new Proxy(this.state, {
      get: (target: StoreState<T>, key) => {
        const value = target[key as keyof T];
        if (typeof value !== 'function') {
          this.trackPropertyAccess(key as keyof T, id);
        }
        return value;
      }
    });
  }

  private shouldComponentUpdate(
    prevState: StoreState<T>,
    modifiedKeys: Set<keyof T>,
    id: string
  ): boolean {
    const allDependencies = this.methodDependencies.union(
      this.subscriptionDependencies.get(id) ?? new Set()
    );

    if (!allDependencies.size) return false;

    return Array.from(allDependencies.intersection(modifiedKeys)).some(
      (key) => prevState[key] !== this.state[key]
    );
  }

  private notifyListeners(
    prevState: StoreState<T>,
    modifiedKeys: Set<keyof T>
  ): void {
    this.listeners.forEach((listener) => listener(prevState, modifiedKeys));
  }

  private createMethodProxy(method: Function) {
    return ((...args: any[]) => {
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

      const beforeMethodState = { ...this.state };
      const result = method.apply(stateTracker, args);

      if (result instanceof Promise) {
        this.notifyListeners(beforeMethodState, modifiedKeys);
        const beforePromiseState = { ...this.state };
        return result.then((value) =>
          this.updateMethodDependencies(beforePromiseState, value, modifiedKeys)
        );
      }

      return this.updateMethodDependencies(
        beforeMethodState,
        result,
        modifiedKeys
      );
    }) as any;
  }

  private updateMethodDependencies(
    state: StoreState<T>,
    result: any,
    modifiedKeys: Set<keyof T>
  ) {
    if (result && modifiedKeys.size > 0) {
      modifiedKeys.forEach((key) => this.methodDependencies.add(key));
      return result;
    }

    this.notifyListeners(state, modifiedKeys);
  }
}
