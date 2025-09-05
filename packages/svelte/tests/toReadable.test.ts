import { describe, test, expect, vi } from 'vitest';
import { Store } from '@ga-ut/store-core';
import { toReadable, bindMethods, select } from '../src';

describe('Svelte adapter - toReadable', () => {
  test('immediate run and subsequent updates', () => {
    const store = new Store({
      count: 0,
      inc() {
        this.count += 1;
      }
    });

    const readable = toReadable(store, (s) => s.count);
    const spy = vi.fn();
    const unsubscribe = readable.subscribe(spy);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);

    store.getState().inc();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(1);

    unsubscribe();
  });

  test('keys option filters updates', () => {
    const store = new Store({
      a: 0,
      b: 0,
      incA() {
        this.a += 1;
      },
      incB() {
        this.b += 1;
      }
    });

    const onA = vi.fn();
    const onB = vi.fn();

    const rA = toReadable(store, (s) => s.a, { keys: ['a'] });
    const rB = toReadable(store, (s) => s.b, { keys: ['b'] });

    const ua = rA.subscribe(onA);
    const ub = rB.subscribe(onB);

    onA.mockClear();
    onB.mockClear();

    store.getState().incA();
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledTimes(0);

    store.getState().incB();
    expect(onA).toHaveBeenCalledTimes(1);
    expect(onB).toHaveBeenCalledTimes(1);

    ua();
    ub();
  });

  test('custom equals prevents redundant notifications', () => {
    const store = new Store({
      obj: { a: 0, b: 0 },
      incA() {
        this.obj = { ...this.obj, a: this.obj.a + 1 };
      },
      incB() {
        this.obj = { ...this.obj, b: this.obj.b + 1 };
      }
    });

    const eq = (x: { a: number }, y: { a: number }) => x.a === y.a;
    const readable = toReadable(store, (s) => ({ a: s.obj.a }), { equals: eq });

    const spy = vi.fn();
    const un = readable.subscribe(spy);
    spy.mockClear();

    store.getState().incB();
    expect(spy).toHaveBeenCalledTimes(0);

    store.getState().incA();
    expect(spy).toHaveBeenCalledTimes(1);

    un();
  });
});

describe('Svelte adapter - bindMethods & select', () => {
  test('bindMethods returns only actions bound to state', () => {
    const store = new Store({
      value: 0,
      inc() {
        this.value += 1;
      }
    });

    const actions = bindMethods(store) as { inc: () => void };
    actions.inc();
    expect(store.getState().value).toBe(1);
  });

  test('select exposes subscribe for derived view', () => {
    const store = new Store({
      a: 0,
      b: 0,
      incA() {
        this.a += 1;
      }
    });

    const derived = select(store, (s) => s.a);
    const spy = vi.fn();
    const unsub = derived.subscribe(spy);
    spy.mockClear();

    store.getState().incA();
    expect(spy).toHaveBeenCalledTimes(1);

    unsub();
  });
});
