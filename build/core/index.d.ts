type StoreState<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? (this: T, ...args: Parameters<T[K]>) => ReturnType<T[K]> : T[K];
};
export declare class Store<T extends object> {
    state: StoreState<T>;
    private listeners;
    constructor(state: StoreState<T>);
    subscribe(render: () => void, keys?: (keyof T)[]): () => void;
    private compareFromKeys;
    private notify;
    private createNotifier;
}
export {};
