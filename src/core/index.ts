type Listener<T> = (prevState: StoreState<T>, key: keyof T) => void;

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
  private listeners = new Set<Listener<T>>();
  private dependencies = new Map<keyof T, Set<keyof T>>();

  constructor(public state: StoreState<T>) {
    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === 'function') {
        Object.assign(this.state, {
          [key]: this.createNotifier(key as keyof T, value)
        });
      }
    });
  }

  subscribe(render: () => void): () => void {
    const wrapper: Listener<T> = (prevState, key) => {
      if (this.validateRender(prevState, this.state, key)) {
        this.state = { ...this.state };
        render();
      }
    };
    this.listeners.add(wrapper);
    return () => this.listeners.delete(wrapper);
  }

  private validateRender(
    prevState: StoreState<T>,
    currentState: StoreState<T>,
    key: keyof T
  ) {
    if (typeof currentState[key] === 'function') {
      const dependencies = this.dependencies.get(key);

      if (dependencies) {
        for (const dep of dependencies) {
          if (prevState[dep] !== currentState[dep]) {
            return true;
          }
        }
      }
    } else {
      if (prevState[key] !== currentState[key]) {
        return true;
      }
    }
    return false;
  }

  private notify(prevState: StoreState<T>, key: keyof T) {
    this.listeners.forEach((listener) => listener(prevState, key));
  }

  private createNotifier(key: keyof T, value: Function) {
    return ((...args: any[]) => {
      const prevState = { ...this.state };

      const accessedKeys = new Set<keyof T>();

      const proxy = new Proxy(this.state, {
        get(target, key) {
          accessedKeys.add(key as keyof T);
          return target[key as keyof T];
        }
      });

      const result = value.apply(proxy, args);

      if (accessedKeys.size > 0) {
        this.dependencies.set(key, accessedKeys);
      }

      this.notify(prevState, key);

      return result;
    }) as any;
  }
}
