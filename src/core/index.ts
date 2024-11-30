export type Listener = () => void;

type StoreState<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (this: T, ...args: Parameters<T[K]>) => ReturnType<T[K]>
    : T[K];
};

export class Store<T extends object> {
  private listeners = new Set<Listener>();

  constructor(public state: StoreState<T>) {
    Object.entries(this.state).forEach(([key, value]) => {
      if (typeof value === 'function') {
        this.state[key as keyof T] = this.createNotifier(value);
      }
    });
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private createNotifier(value: Function) {
    return ((...args: any[]) => {
      const prevState = { ...this.state };
      const result = value.apply(this.state, args);
      const isEqual = this.shallowCompare(prevState, this.state);

      if (!isEqual) {
        this.state = { ...this.state };
        this.notify();
      }

      return result;
    }) as any;
  }

  private shallowCompare(
    prevState: StoreState<T>,
    state: StoreState<T>
  ): boolean {
    const prevStateKeys = Object.keys(prevState) as (keyof T)[];
    const stateKeys = Object.keys(state) as (keyof T)[];

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

  subscribe(listener: Listener): Listener {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
