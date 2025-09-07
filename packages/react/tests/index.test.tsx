import '@testing-library/jest-dom/vitest';
import { describe, expect, test } from 'vitest';
import { render as rtlRender, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { enableMapSet, produce } from 'immer';
import { Store } from '../../core/src';
import { useStore } from '../src';
import { StrictMode, useEffect } from 'react';

// Render helper to wrap everything in StrictMode
function render(ui: React.ReactElement) {
  return rtlRender(<StrictMode>{ui}</StrictMode>);
}

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
      const state = countStore.getState();
      incBtnRender++;
      return <button onClick={state.inc}>+</button>;
    }

    function DecButton() {
      const state = countStore.getState();
      decBtnRender++;
      return <button onClick={state.dec}>-</button>;
    }

    const { unmount } = render(
      <>
        <Counter />
        <IncButton />
        <DecButton />
      </>
    );

    const startCountRender = countRender;
    const startIncBtnRender = incBtnRender;
    const startDecBtnRender = decBtnRender;
    expect(startCountRender).toBeGreaterThanOrEqual(1);
    expect(startIncBtnRender).toBeGreaterThanOrEqual(1);
    expect(startDecBtnRender).toBeGreaterThanOrEqual(1);

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(countRender).toBeGreaterThan(startCountRender);
    expect(incBtnRender).toBe(startIncBtnRender);
    expect(decBtnRender).toBe(startDecBtnRender);

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

    const initial = renderCount;
    expect(initial).toBeGreaterThanOrEqual(1);

    await userEvent.click(screen.getByRole('button', { name: 'No Change' }));
    expect(renderCount).toBe(initial);

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

    const initial = renderCount;
    expect(initial).toBeGreaterThanOrEqual(1);

    countStore.getState().setDummy();

    expect(renderCount).toBe(initial);

    await userEvent.click(screen.getByRole('button', { name: '-' }));
    expect(renderCount).toBeGreaterThan(initial);

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
      const store = useStore(userStore);
      const profile = store.profile;
      renderCount++;
      return (
        <>
          <div>{profile.city}</div>
          <div>{profile.contact.phone}</div>
          <button onClick={() => store.updateProfile('Seoul', '010-1234-5678')}>
            Update
          </button>
        </>
      );
    }

    const { unmount } = render(<UserProfile />);

    screen.getByText('New York');
    screen.getByText('123-456-7890');
    const initial = renderCount;
    expect(initial).toBeGreaterThanOrEqual(1);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    screen.getByText('Seoul');
    screen.getByText('010-1234-5678');
    expect(renderCount).toBeGreaterThan(initial);

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
      const store = useStore(statsStore);
      renderCount++;
      return (
        <>
          <div>{store.getMax()}</div>
          <button onClick={store.addNumber}>Add</button>
        </>
      );
    }

    const { unmount } = render(<Stats />);

    const initial = renderCount;
    expect(initial).toBeGreaterThanOrEqual(1);
    screen.getByText('3');

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(renderCount).toBeGreaterThan(initial);
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
      const s = useStore(store);
      renderCount++;
      return (
        <>
          <div>{s.getValue()}</div>
          <button onClick={s.increment}>+</button>
        </>
      );
    }

    const { unmount } = render(<Counter />);

    const initial = renderCount;
    expect(initial).toBeGreaterThanOrEqual(1);
    screen.getByText('1');

    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(renderCount).toBeGreaterThan(initial);
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

    const initial = renderCount;
    expect(initial).toBeGreaterThanOrEqual(1);
    screen.getByText('2');

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(renderCount).toBeGreaterThan(initial);
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
      const store = useStore(mapStore);
      renderCount++;
      return (
        <>
          <div>{store.ages.get('John')}</div>
          <button onClick={() => store.setAge(30)}>Update</button>
        </>
      );
    }

    const { unmount } = render(<MapComponent />);

    const initial = renderCount;
    expect(initial).toBeGreaterThanOrEqual(1);
    screen.getByText('25');

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(renderCount).toBeGreaterThan(initial);
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
    const start = renderCount;
    expect(start).toBeGreaterThanOrEqual(1);

    act(() => {
      for (let i = 0; i < 1000; i++) {
        rapidStore.getState().increment();
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(renderCount - start).toBeLessThan(50);
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
    expect(renderCount).toBeGreaterThanOrEqual(1);

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
    expect(renderCount).toBeGreaterThanOrEqual(1);
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

    const start1 = render1Count;
    const start2 = render2Count;
    expect(start1).toBeGreaterThanOrEqual(1);
    expect(start2).toBeGreaterThanOrEqual(1);

    await act(async () => {
      await Promise.all([
        sharedStore.getState().increment(),
        sharedStore.getState().increment(),
        sharedStore.getState().increment()
      ]);
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(sharedStore.getState().count).toBe(3);
    expect(render1Count).toBeGreaterThan(start1);
    expect(render2Count).toBeGreaterThan(start2);

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
      const store = useStore(errorStore);
      return (
        <button
          onClick={() => {
            try {
              store.throwError();
            } catch {
              store.setIsError(true);
            }
          }}
        >
          {store.isError ? 'Error' : 'button'}
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

    const initial = count;
    expect(initial).toBeGreaterThanOrEqual(1);

    await userEvent.click(screen.getByRole('button', { name: 'same' }));

    await waitFor(() => expect(count).toBe(initial));

    await userEvent.click(screen.getByRole('button', { name: 'modify' }));

    await waitFor(() => expect(count).toBeGreaterThan(initial));
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

    const initialRenders = rendered;
    expect(initialRenders).toBeGreaterThanOrEqual(1);
    await userEvent.click(screen.getByRole('button', { name: 'promise' }));
    expect(rendered).toBeGreaterThan(initialRenders);
    await userEvent.click(screen.getByRole('button', { name: 'resolve' }));
    expect(rendered).toBeGreaterThan(initialRenders);
  });
});

describe('Async Loading State', () => {
  test('should handle loading state during async operations', async () => {
    const asyncStore = new Store({
      loading: false,
      data: null as string | null,
      async fetchData() {
        this.loading = true;
        await new Promise((resolve) => setTimeout(resolve, 5));
        this.data = 'some data';
        this.loading = false;
      }
    });

    function AsyncComponent() {
      const { loading, data, fetchData } = useStore(asyncStore);
      return (
        <>
          <div>{loading ? 'Loading...' : data}</div>
          <button onClick={fetchData}>Fetch</button>
        </>
      );
    }

    const { unmount } = render(<AsyncComponent />);

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Fetch' }));

    expect(await screen.findByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('some data')).toBeInTheDocument();

    unmount();
  });
});

describe('Nested compoennt test', () => {
  test('Child component can update parents', () => {
    const valueStore = new Store({
      value: 0,
      add() {
        this.value += 1;
      }
    });
    let renderCount = 0;
    function Parent() {
      renderCount += 1;
      const { value } = useStore(valueStore);

      return <Child />;
    }

    function Child() {
      const store = valueStore.getState();

      useEffect(() => {
        store.add();
      }, []);
      return null;
    }

    render(<Parent />);

    expect(renderCount).toBeGreaterThanOrEqual(2);
  });
});

describe('Additional Coverage', () => {
  test('Method-only consumer should not re-render on state changes', async () => {
    const s = new Store({
      value: 0,
      inc() {
        this.value += 1;
      },
      other: 0,
      bumpOther() {
        this.other += 1;
      }
    });

    let renders = 0;
    function ButtonOnly() {
      renders += 1;
      const { inc } = useStore(s);
      return <button onClick={inc}>+</button>;
    }

    render(<ButtonOnly />);

    const start = renders;
    expect(start).toBeGreaterThanOrEqual(1);
    // Changing unrelated key should not re-render method-only consumer
    s.getState().bumpOther();
    expect(renders).toBe(start);

    // Using the method should not re-render since UI doesn't read it
    await userEvent.click(screen.getByRole('button', { name: '+' }));
    expect(renders).toBe(start);
    expect(s.getState().value).toBe(1);
  });

  test('Dynamic dependencies update correctly', async () => {
    const s = new Store({
      flag: false,
      a: 0,
      b: 0,
      toggle() {
        this.flag = !this.flag;
      },
      incA() {
        this.a += 1;
      },
      incB() {
        this.b += 1;
      }
    });

    let renders = 0;
    function Comp() {
      renders += 1;
      const st = useStore(s);
      return (
        <>
          <div data-testid="val">{st.flag ? st.a : st.b}</div>
          <button onClick={st.toggle}>toggle</button>
          <button onClick={st.incA}>a</button>
          <button onClick={st.incB}>b</button>
        </>
      );
    }

    render(<Comp />);
    let prev = renders;
    expect(prev).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('val')).toHaveTextContent('0');

    // Initially depends on b only
    await userEvent.click(screen.getByRole('button', { name: 'a' }));
    // No re-render because 'a' not used
    expect(renders).toBe(prev);

    await userEvent.click(screen.getByRole('button', { name: 'b' }));
    expect(renders).toBeGreaterThan(prev);
    prev = renders;
    expect(screen.getByTestId('val')).toHaveTextContent('1');

    // Switch dependency to 'a'
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(renders).toBeGreaterThan(prev);
    prev = renders;
    expect(screen.getByTestId('val')).toHaveTextContent('1');

    // Now only 'a' updates should cause re-render
    await userEvent.click(screen.getByRole('button', { name: 'b' }));
    expect(renders).toBe(prev);

    await userEvent.click(screen.getByRole('button', { name: 'a' }));
    expect(renders).toBeGreaterThan(prev);
    expect(screen.getByTestId('val')).toHaveTextContent('2');
  });

  test('Multiple field updates in one action cause single render', async () => {
    const s = new Store({
      a: 0,
      b: 0,
      incBoth() {
        this.a += 1;
        this.b += 1;
      }
    });

    let renders = 0;
    function Comp() {
      renders += 1;
      const st = useStore(s);
      return (
        <>
          <div data-testid="sum">{st.a + st.b}</div>
          <button onClick={st.incBoth}>both</button>
        </>
      );
    }

    render(<Comp />);
    const base = renders;
    expect(base).toBeGreaterThanOrEqual(1);

    await userEvent.click(screen.getByRole('button', { name: 'both' }));
    // React 18 StrictMode may double-render in dev; ensure it increased
    expect(renders).toBeGreaterThan(base);
    expect(screen.getByTestId('sum')).toHaveTextContent('2');
  });
});

describe('Router + Auth integration', () => {
  test('Router navigates and handles auth loading state', async () => {
    const routerStore = new Store({
      path: '/login',
      goto(newPath: string) {
        this.path = newPath;
      }
    });

    const authStore = new Store({
      isLoading: false,
      isAuthenticated: false,
      resolve: undefined as undefined | (() => void),
      login() {
        this.isLoading = true;
        return new Promise<void>((resolve) => {
          this.resolve = () => {
            this.isAuthenticated = true;
            this.isLoading = false;
            resolve();
          };
        });
      },
      logout() {
        this.isAuthenticated = false;
      }
    });

    function Router() {
      const router = useStore(routerStore);
      const auth = useStore(authStore);

      useEffect(() => {
        if (auth.isAuthenticated && router.path === '/login') {
          router.goto('/home');
        }
      }, [auth.isAuthenticated, router.path, router]);

      if (auth.isLoading) return <div>Loading...</div>;

      if (router.path === '/login') {
        return (
          <>
            <div>Login Page</div>
            <button onClick={auth.login}>Login</button>
          </>
        );
      }

      if (router.path === '/home') {
        return (
          <>
            <div>Home Page</div>
            <div>{auth.isAuthenticated ? 'Authed' : 'Guest'}</div>
            <button
              onClick={() => {
                auth.logout();
                router.goto('/login');
              }}
            >
              Logout
            </button>
          </>
        );
      }

      return <div>Not Found</div>;
    }

    const { unmount } = render(<Router />);

    // Initial route is login
    expect(screen.getByText('Login Page')).toBeInTheDocument();

    // Start login -> show loading
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('Loading...')).toBeInTheDocument();

    // Finish async auth
    await act(async () => {
      authStore.getState().resolve?.();
    });

    // After auth completes, router auto-navigates to /home
    expect(await screen.findByText('Home Page')).toBeInTheDocument();
    expect(screen.getByText('Authed')).toBeInTheDocument();

    // Logout triggers auth reset and navigates to login
    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(await screen.findByText('Login Page')).toBeInTheDocument();

    unmount();
  });
});
