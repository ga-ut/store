export type Listener = () => void;

export class Store<T> {
  state: T;

  private listeners = new Set<Listener>();

  constructor(params: T) {
    this.state = params;
  }

  private notify = () => {
    this.listeners.forEach((listener) => listener());
  };

  subscribe = (listener: Listener): Listener => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setState = (fn: (snapshot: T) => Partial<T>) => {
    const prevSnapshot = this.state;

    this.state = {
      ...prevSnapshot,
      ...fn(this.state)
    };

    this.notify();
  };
}
