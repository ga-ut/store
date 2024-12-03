type Listener<T> = (
  prevState: StoreState<T>,
  currentState: StoreState<T>
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
      ) => ReturnType<T[K]>
    : T[K];
};

export class Store<T extends object> {
  private listeners = new Set<Listener<T>>();

  constructor(public state: StoreState<T>) {
    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === 'function') {
        Object.assign(this.state, { [key]: this.createNotifier(value) });
      }
    });
  }

  subscribe(render: () => void, keys?: (keyof T)[]): () => void {
    const wrapper = (prevState: StoreState<T>, currentState: StoreState<T>) => {
      if (!this.compareFromKeys(keys, prevState, currentState)) {
        this.state = { ...currentState };
        render();
      }
    };
    this.listeners.add(wrapper);
    return () => this.listeners.delete(wrapper);
  }

  private compareFromKeys(
    keys: (keyof T)[] | undefined,
    prevState: StoreState<T>,
    currentState: StoreState<T>
  ) {
    if (!keys?.length) {
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

  private notify(prevState: StoreState<T>, currentState: StoreState<T>) {
    this.listeners.forEach((listener) => listener(prevState, currentState));
  }

  private createNotifier(value: Function) {
    return ((...args: any[]) => {
      const prevState = { ...this.state };
      const result = value.apply(this.state, args);

      this.notify(prevState, this.state);

      return result;
    }) as any;
  }
}
