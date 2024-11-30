export type Listener = () => void;
type StoreState<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? (this: T, ...args: Parameters<T[K]>) => ReturnType<T[K]> : T[K];
};
export declare class Store<T extends object> {
    state: StoreState<T>;
    private listeners;
    constructor(state: StoreState<T>);
    private notify;
    private createNotifier;
    private shallowCompare;
    subscribe(listener: Listener): Listener;
}
export {};
