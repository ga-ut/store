import { describe, test, expect, vi } from 'vitest';
import { Store } from '@ga-ut/store-core';
import { toRef, select, bindMethods } from '../src';

function shallowRef<V>(v: V) {
  return { value: v } as { value: V };
}

describe('Vue adapter - toRef', () => {
  test('initial value and updates', () => {
    const store = new Store({
      count: 0,
      inc() {
        this.count += 1;
      }
    });

    const { ref } = toRef(store, (s) => s.count, shallowRef);
    expect(ref.value).toBe(0);
    store.getState().inc();
    expect(ref.value).toBe(1);
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

    const { ref: rA } = toRef(store, (s) => s.a, shallowRef, { keys: ['a'] });
    const { ref: rB } = toRef(store, (s) => s.b, shallowRef, { keys: ['b'] });

    store.getState().incA();
    expect(rA.value).toBe(1);
    expect(rB.value).toBe(0);

    store.getState().incB();
    expect(rA.value).toBe(1);
    expect(rB.value).toBe(1);
  });

  test('custom equals', () => {
    const store = new Store({
      obj: { a: 0, b: 0 },
      incB() {
        this.obj = { ...this.obj, b: this.obj.b + 1 };
      },
      incA() {
        this.obj = { ...this.obj, a: this.obj.a + 1 };
      }
    });

    const eq = (x: { a: number }, y: { a: number }) => x.a === y.a;
    const { ref } = toRef(store, (s) => ({ a: s.obj.a }), shallowRef, { equals: eq });
    store.getState().incB();
    expect(ref.value.a).toBe(0);
    store.getState().incA();
    expect(ref.value.a).toBe(1);
  });
});

describe('Vue adapter - select', () => {
  test('select multiple values into a tuple ref', () => {
    const store = new Store({ a: 0, b: 0, incA() { this.a += 1; } });
    const { ref } = select(store, [ (s) => s.a, (s) => s.b ], shallowRef);
    expect(ref.value).toEqual([0, 0]);
    store.getState().incA();
    expect(ref.value).toEqual([1, 0]);
  });
});

describe('Vue adapter - bindMethods', () => {
  test('returns only actions', () => {
    const store = new Store({
      user: { name: 'a' },
      set(name: string) { this.user = { name }; }
    });
    const { set } = bindMethods(store) as { set: (name: string) => void };
    set('b');
    expect(store.getState().user.name).toBe('b');
  });
});

