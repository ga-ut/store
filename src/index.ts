import { useSyncExternalStore } from 'react'

export type Listener = () => void

export class Store<T> {
  snapshot: T

  private listeners = new Set<Listener>()

  constructor(params: T) {
    this.snapshot = params
  }

  notify = () => {
    this.listeners.forEach((listener) => listener())
  }

  subscribe = (listener: Listener): Listener => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => {
    return this.snapshot
  }

  setSnapshot = (fn: (snapshot: Partial<T>) => Partial<T>) => {
    const prevSnapshot = this.snapshot

    this.snapshot = {
      ...prevSnapshot,
      ...fn(this.snapshot)
    }

    this.notify()
  }
}

export const useStore = <T>(store: Store<T>) => {
  const state = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getSnapshot()
  )

  return {
    state,
    setState: store.setSnapshot
  }
}
