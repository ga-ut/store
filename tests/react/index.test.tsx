import React from 'react';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { enableMapSet, produce } from 'immer';
import { Store } from '../../src';
import { useStore } from '../../src/react';

enableMapSet();

describe('Store with React Integration', () => {
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
});
