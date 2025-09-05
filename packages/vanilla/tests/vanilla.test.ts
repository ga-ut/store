import { describe, test, expect, vi } from 'vitest';
import { Store } from '@ga-ut/store-core';
import { watch, on, select, toObservable } from '../src';

describe('vanilla - watch', () => {
  test('fireImmediately and basic updates', () => {
    const store = new Store({
      n: 0,
      inc() { this.n += 1; }
    });
    const spy = vi.fn();
    const unsub = watch(store, s => s.n, (v) => spy(v), { fireImmediately: true });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);
    store.getState().inc();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(1);
    unsub();
  });

  test('keys option limits triggers', () => {
    const store = new Store({ a: 0, b: 0, incA() { this.a += 1; }, incB() { this.b += 1; } });
    const spyA = vi.fn();
    const spyB = vi.fn();
    const ua = watch(store, s => s.a, (v) => spyA(v), { keys: ['a'] });
    const ub = watch(store, s => s.b, (v) => spyB(v), { keys: ['b'] });
    store.getState().incA();
    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(0);
    store.getState().incB();
    expect(spyA).toHaveBeenCalledTimes(1);
    expect(spyB).toHaveBeenCalledTimes(1);
    ua(); ub();
  });

  test('debounce limits rapid updates', async () => {
    vi.useFakeTimers();
    const store = new Store({ n: 0, set(v:number){ this.n = v; } });
    const spy = vi.fn();
    const unsub = watch(store, s => s.n, (v) => spy(v), { debounceMs: 20 });
    store.getState().set(1);
    store.getState().set(2);
    store.getState().set(3);
    expect(spy).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(20);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(3);
    unsub();
    vi.useRealTimers();
  });

  test('throttle limits frequency', async () => {
    vi.useFakeTimers();
    const store = new Store({ n: 0, set(v:number){ this.n = v; } });
    const spy = vi.fn();
    const unsub = watch(store, s => s.n, (v) => spy(v), { throttleMs: 30 });
    store.getState().set(1);
    expect(spy).toHaveBeenCalledTimes(1);
    store.getState().set(2);
    expect(spy).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(31);
    store.getState().set(3);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(3);
    unsub();
    vi.useRealTimers();
  });
});

describe('vanilla - on/select/toObservable', () => {
  test('on subscribes to explicit keys', () => {
    const store = new Store({ a:0, b:0, incA(){ this.a+=1; }, incB(){ this.b+=1; } });
    const spy = vi.fn();
    const unsub = on(store, ['a'], spy);
    store.getState().incB();
    expect(spy).toHaveBeenCalledTimes(0);
    store.getState().incA();
    expect(spy).toHaveBeenCalledTimes(1);
    unsub();
  });

  test('select get/subscribe', () => {
    const store = new Store({ x:0, inc(){ this.x+=1; } });
    const view = select(store, s => s.x);
    const spy = vi.fn();
    const un = view.subscribe(spy);
    spy.mockClear();
    store.getState().inc();
    expect(view.get()).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    un();
  });

  test('toObservable interop', () => {
    const store = new Store({ x:0, inc(){ this.x+=1; } });
    const obs = toObservable(store, s => s.x);
    const spy = vi.fn();
    const un = obs.subscribe({ next: spy });
    spy.mockClear();
    store.getState().inc();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(obs.getValue()).toBe(1);
    un();
  });
});
