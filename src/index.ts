import { useSyncExternalStore } from 'react'

export type Listener = () => void

export class Store<T> {
  snapshot: T

  private listeners = new Set<Listener>()

  constructor(params: T) {
    this.snapshot = params
  }

  notify = (): void => {
    this.listeners.forEach((listener) => listener())
  }

  subscribe = (listener: Listener): Listener => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = (): T => {
    return this.snapshot
  }

  setSnapshot = (snapshot: Partial<T>): void => {
    const prevSnapshot = this.snapshot

    this.snapshot = {
      ...prevSnapshot,
      ...snapshot
    }

    this.notify()
  }
}

export const useStore = <T>(
  store: Store<T>
): { state: T; setState: (snapshot: Partial<T>) => void } => {
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot()
  )

  return {
    state,
    setState: (snapshot: Partial<T>) => store.setSnapshot(snapshot)
  }
}
