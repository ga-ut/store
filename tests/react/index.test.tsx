import '@testing-library/jest-dom/vitest';
import { describe, expect, test } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { enableMapSet, produce } from 'immer';
import { Store } from '../../src/core';
import { useStore } from '../../src/react';

enableMapSet();

describe('Basic State Management', () => {
  const countStore = new Store({
    count: 1,
    dummy: 0,
    inc() {
      this.count += 1;
    },
    dec() {
      this.count -= 1;
    },
    noChange() {
      this.count = this.count;
    },
    setDummy() {
      this.dummy += 1;
    }
  });

  test('should only re-render components that use changed state', async () => {
    let countRender = 0;
    let incBtnRender = 0;
    let decBtnRender = 0;

    function Counter() {
      const { count } = useStore(countStore);
      countRender++;
      return <div>{count}</div>;
    }

    function IncButton() {
      incBtnRender++;
      return <button onClick={countStore.getState().inc}>+</button>;
    }

    function DecButton() {
      decBtnRender++;
      return <button onClick={countStore.getState().dec}>-</button>;
    }

    const { unmount } = render(
      <>
        <Counter />
        <IncButton />
        <DecButton />
      </>
    );

    expect(countRender).toBe(1);
    expect(incBtnRender).toBe(1);
    expect(decBtnRender).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(countRender).toBe(2);
    expect(incBtnRender).toBe(1);
    expect(decBtnRender).toBe(1);

    unmount();
  });

  test('should not re-render when state remains unchanged', async () => {
    let renderCount = 0;

    function Counter() {
      const { count, noChange } = useStore(countStore);
      renderCount++;
      return (
        <>
          <div>{count}</div>
          <button onClick={noChange}>No Change</button>
        </>
      );
    }

    const { unmount } = render(<Counter />);

    expect(renderCount).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'No Change' }));
    expect(renderCount).toBe(1);

    unmount();
  });

  test('should not re-render when only dummy state is changed', async () => {
    let renderCount = 0;

    function Counter() {
      const { count, dec } = useStore(countStore);
      renderCount++;
      return (
        <>
          <div>{count}</div>
          <button onClick={dec}>-</button>
        </>
      );
    }

    const { unmount } = render(<Counter />);

    expect(renderCount).toBe(1);

    countStore.getState().setDummy();

    expect(renderCount).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: '-' }));
    expect(renderCount).toBe(2);

    unmount();
  });
});

describe('Complex State Updates', () => {
  test('should handle immer updates correctly', async () => {
    const userStore = new Store({
      profile: {
        city: 'New York',
        contact: {
          phone: '123-456-7890'
        }
      },
      updateProfile(newCity: string, newPhone: string) {
        this.profile = produce(this.profile, (draft) => {
          draft.city = newCity;
          draft.contact.phone = newPhone;
        });
      }
    });

    let renderCount = 0;

    function UserProfile() {
      const { profile, updateProfile } = useStore(userStore);
      renderCount++;
      return (
        <>
          <div>{profile.city}</div>
          <div>{profile.contact.phone}</div>
          <button onClick={() => updateProfile('Seoul', '010-1234-5678')}>
            Update
          </button>
        </>
      );
    }

    const { unmount } = render(<UserProfile />);

    screen.getByText('New York');
    screen.getByText('123-456-7890');
    expect(renderCount).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    screen.getByText('Seoul');
    screen.getByText('010-1234-5678');
    expect(renderCount).toBe(2);

    unmount();
  });
});

describe('Getter Functions', () => {
  test('should optimize renders with computed values', async () => {
    const statsStore = new Store({
      numbers: [1, 2, 3],
      getMax() {
        return Math.max(...this.numbers);
      },
      addNumber() {
        this.numbers = [...this.numbers, 4];
      }
    });

    let renderCount = 0;

    function Stats() {
      const { getMax, addNumber } = useStore(statsStore);
      renderCount++;
      return (
        <>
          <div>{getMax()}</div>
          <button onClick={addNumber}>Add</button>
        </>
      );
    }

    const { unmount } = render(<Stats />);

    expect(renderCount).toBe(1);
    screen.getByText('3');

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(renderCount).toBe(2);
    screen.getByText('4');

    unmount();
  });

  test('should not cause infinite renders with getters', async () => {
    const store = new Store({
      value: 1,
      getValue() {
        return this.value;
      },
      increment() {
        this.value += 1;
      }
    });

    let renderCount = 0;

    function Counter() {
      const { getValue, increment } = useStore(store);
      renderCount++;
      return (
        <>
          <div>{getValue()}</div>
          <button onClick={increment}>+</button>
        </>
      );
    }

    const { unmount } = render(<Counter />);

    expect(renderCount).toBe(1);
    screen.getByText('1');

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(renderCount).toBe(2);
    screen.getByText('2');

    unmount();
  });
});

describe('Collection Types', () => {
  test('should handle Set updates correctly', async () => {
    const setStore = new Store({
      items: new Set([1, 2]),
      add() {
        this.items = new Set([...this.items, 3]);
      }
    });

    let renderCount = 0;

    function SetComponent() {
      const { items, add } = useStore(setStore);
      renderCount++;
      return (
        <>
          <div>{items.size}</div>
          <button onClick={add}>Add</button>
        </>
      );
    }

    const { unmount } = render(<SetComponent />);

    expect(renderCount).toBe(1);
    screen.getByText('2');

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(renderCount).toBe(2);
    screen.getByText('3');

    unmount();
  });

  test('should handle Map updates correctly', async () => {
    const mapStore = new Store({
      ages: new Map([['John', 25]]),
      setAge(age: number) {
        this.ages = new Map(this.ages.set('John', age));
      }
    });

    let renderCount = 0;

    function MapComponent() {
      const { ages, setAge } = useStore(mapStore);
      renderCount++;
      return (
        <>
          <div>{ages.get('John')}</div>
          <button onClick={() => setAge(30)}>Update</button>
        </>
      );
    }

    const { unmount } = render(<MapComponent />);

    expect(renderCount).toBe(1);
    screen.getByText('25');

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(renderCount).toBe(2);
    screen.getByText('30');

    unmount();
  });
});

describe('Error Cases and Edge Scenarios', () => {
  test('should handle rapid state updates without memory leaks', async () => {
    const rapidStore = new Store({
      count: 0,
      increment() {
        this.count += 1;
      }
    });

    let renderCount = 0;
    function RapidCounter() {
      const { count } = useStore(rapidStore);
      renderCount++;
      return <div>{count}</div>;
    }

    const { unmount } = render(<RapidCounter />);
    expect(renderCount).toBe(1);

    act(() => {
      for (let i = 0; i < 1000; i++) {
        rapidStore.getState().increment();
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(renderCount).toBeLessThan(50);
    expect(rapidStore.getState().count).toBe(1000);

    unmount();
  });

  test('should handle circular references', () => {
    const circularStore = new Store({
      obj: {} as any,
      setCircular() {
        this.obj.self = this.obj;
      }
    });

    let renderCount = 0;

    function CircularComponent() {
      const { obj } = useStore(circularStore);
      renderCount++;
      return <div>{obj ? 'has obj' : 'no obj'}</div>;
    }

    const { unmount } = render(<CircularComponent />);
    expect(renderCount).toBe(1);

    expect(() => {
      act(() => {
        circularStore.getState().setCircular();
      });
    }).not.toThrow();

    unmount();
  });

  test('should handle null and undefined values', () => {
    const nullableStore = new Store({
      value: 'initial' as string | null | undefined,
      setNull() {
        this.value = null;
      },
      setUndefined() {
        this.value = undefined;
      }
    });

    let renderCount = 0;

    function NullableComponent() {
      const { value } = useStore(nullableStore);
      renderCount++;
      return (
        <div data-testid="value">
          {value === null ? 'null' : value === undefined ? 'undefined' : value}
        </div>
      );
    }

    const { unmount } = render(<NullableComponent />);
    expect(renderCount).toBe(1);
    expect(screen.getByTestId('value')).toHaveTextContent('initial');

    act(() => {
      nullableStore.getState().setNull();
    });
    expect(screen.getByTestId('value')).toHaveTextContent('null');

    act(() => {
      nullableStore.getState().setUndefined();
    });
    expect(screen.getByTestId('value')).toHaveTextContent('undefined');

    unmount();
  });

  test('should handle concurrent updates from multiple components', async () => {
    const sharedStore = new Store({
      count: 0,
      increment() {
        this.count += 1;
      }
    });

    let render1Count = 0;
    let render2Count = 0;

    function Counter1() {
      const { count, increment } = useStore(sharedStore);
      render1Count++;
      return <button onClick={increment}>Counter1: {count}</button>;
    }

    function Counter2() {
      const { count } = useStore(sharedStore);
      render2Count++;
      return <div>Counter2: {count}</div>;
    }

    const { unmount } = render(
      <>
        <Counter1 />
        <Counter2 />
      </>
    );

    expect(render1Count).toBe(1);
    expect(render2Count).toBe(1);

    await act(async () => {
      await Promise.all([
        sharedStore.getState().increment(),
        sharedStore.getState().increment(),
        sharedStore.getState().increment()
      ]);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(sharedStore.getState().count).toBe(3);
    expect(render1Count).toBeGreaterThan(1);
    expect(render2Count).toBeGreaterThan(1);

    unmount();
  });

  test('should handle errors thrown inside Store actions within a component', async () => {
    const errorStore = new Store({
      isError: false,
      throwError() {
        throw new Error('Something went wrong in the store!');
      },
      setIsError(error: boolean) {
        this.isError = error;
      }
    });

    function ErrorComponent() {
      const { isError, setIsError, throwError } = useStore(errorStore);
      return (
        <button
          onClick={() => {
            try {
              throwError();
            } catch {
              setIsError(true);
            }
          }}
        >
          {isError ? 'Error' : 'button'}
        </button>
      );
    }

    const { unmount } = render(<ErrorComponent />);

    expect(
      screen.queryByRole('button', { name: 'Error' })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'button' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Error' })).toBeInTheDocument();
    });

    unmount();
  });
});

describe('Await async test', () => {
  test('Change state after async call', async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 100));
    const store = new Store({
      num: 0,
      async same() {
        await promise;
        this.num = 0;
      },
      async modify() {
        await promise;
        this.num = 1;
      }
    });

    let count = 0;

    function Test() {
      count += 1;
      const { num, same, modify } = useStore(store);

      return (
        <>
          <button onClick={same}>same</button>
          <button onClick={modify}>modify</button>
        </>
      );
    }

    render(<Test />);

    expect(count).toBe(1);

    await userEvent.click(screen.getByRole('button', { name: 'same' }));

    await waitFor(() => expect(count).not.toBe(2));

    await userEvent.click(screen.getByRole('button', { name: 'modify' }));

    await waitFor(() => expect(count).toBe(2));
  });
  test('Change state inside promise', async () => {
    const store = new Store({
      count: 0,
      resolve: undefined as ((value: unknown) => void) | undefined,
      fn() {
        return new Promise((resolve) => {
          this.count += 1;
          this.resolve = () => {
            resolve(undefined);
            this.count += 1;
          };
        });
      }
    });

    let rendered = 0;
    function Comp() {
      rendered += 1;
      const { count, resolve, fn } = useStore(store);

      return (
        <>
          <button onClick={fn}>promise</button>
          <button onClick={resolve}>resolve</button>
          {count}
        </>
      );
    }

    render(<Comp />);

    expect(rendered).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'promise' }));
    expect(rendered).toBe(2);
    await userEvent.click(screen.getByRole('button', { name: 'resolve' }));
    expect(rendered).toBe(3);
  });
});
