export type Listener = () => void;
export declare class Store<T> {
    state: T;
    private listeners;
    constructor(params: T);
    private notify;
    subscribe: (listener: Listener) => Listener;
    setState: (fn: (snapshot: T) => Partial<T>) => void;
}
