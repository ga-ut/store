import { Store } from '../core/index';
export declare function useStore<T extends object>(store: Store<T>, key?: (keyof T)[]): void;
