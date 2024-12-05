import React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { enableMapSet, produce } from 'immer';
import { Store } from '../../src';
import { useStore } from '../../src/react';

enableMapSet();

const countStore = new Store({
  count: 1,
  dummy: 0,
  nope() {
    this.count = this.count;
  },
  inc() {
    this.count += 1;
  },
  dec() {
    this.count -= 1;
  },
  dummyInc() {
    this.dummy += 1;
  }
});

test('Just count rendered', async () => {
  let countRender = 0;
  let incBtnRender = 0;
  let decBtnRender = 0;

  function Test() {
    return (
      <>
        <Count />
        <IncBtn />
        <DecBtn />
      </>
    );
  }

  function Count() {
    const { count } = useStore(countStore);
    countRender++;
    return count;
  }

  function IncBtn() {
    incBtnRender++;
    return <button onClick={countStore.state.inc}>+</button>;
  }

  function DecBtn() {
    decBtnRender++;
    return <button onClick={countStore.state.dec}>-</button>;
  }

  render(<Test />);

  expect(countRender).toBe(1);
  expect(incBtnRender).toBe(1);
  expect(decBtnRender).toBe(1);

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(countRender).toBe(2);
  expect(incBtnRender).toBe(1);
  expect(decBtnRender).toBe(1);

  screen.getByText('2');
});

test('Shallow state change test', async () => {
  let countRender = 0;
  let nopeBtnRender = 0;

  function Count() {
    const { count } = useStore(countStore);
    countRender++;
    return count;
  }

  function NopeBtn() {
    const { nope } = useStore(countStore);
    nopeBtnRender++;
    return <button onClick={nope}>nope</button>;
  }

  render(
    <>
      <Count />
      <NopeBtn />
    </>
  );

  await userEvent.click(screen.getByRole('button', { name: 'nope' }));

  expect(countRender).toBe(1);
  expect(nopeBtnRender).toBe(1);
});

test('Bound from key test', async () => {
  let countRender = 0;
  let dummyRender = 0;

  function Count() {
    const { count } = useStore(countStore);
    countRender++;
    return (
      <>
        {count}
        <Dummy />
        <button onClick={countStore.state.dummyInc}>+</button>
      </>
    );
  }

  function Dummy() {
    const { dummy } = useStore(countStore);
    dummyRender++;
    return dummy;
  }

  render(
    <>
      <Count />
    </>
  );

  expect(countRender).toBe(1);

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(dummyRender).toBe(2);
});

test('Object value test with immer', async () => {
  const personStore = new Store({
    name: 'Alice',
    age: 25,
    address: {
      city: 'New York',
      zip: '10001'
    },
    contact: {
      email: 'alice@example.com',
      phone: '123-456-7890'
    },
    updateUserProfile(newCity: string, newPhone: string) {
      this.address = produce(this.address, (draft) => {
        draft.city = newCity;
      });

      this.contact = produce(this.contact, (draft) => {
        draft.phone = newPhone;
      });
    }
  });

  let renderCount = 0;
  function Test() {
    const { address, contact, updateUserProfile } = useStore(personStore);
    renderCount++;

    return (
      <>
        <span>{address.city}</span>
        <span>{contact.phone}</span>
        <button onClick={() => updateUserProfile('Seoul', '012-345-6789')}>
          update
        </button>
      </>
    );
  }

  render(<Test />);

  screen.getByText('New York');
  screen.getByText('123-456-7890');

  await userEvent.click(screen.getByRole('button', { name: 'update' }));

  screen.getByText('Seoul');
  screen.getByText('012-345-6789');
  expect(renderCount).toBe(2);

  await userEvent.click(screen.getByRole('button', { name: 'update' }));
  expect(renderCount).toBe(2);
});

test('Array value test', async () => {
  const store = new Store({
    numbers: [0],
    add() {
      this.numbers = produce(this.numbers, (draft) => {
        draft.push(Math.max(...draft) + 1);
      });
    }
  });

  function Test() {
    const { numbers, add } = useStore(store);

    return (
      <>
        {numbers.map((number) => (
          <div key={number}>{number}</div>
        ))}
        <button onClick={add}>+</button>
      </>
    );
  }

  render(<Test />);

  screen.getByText('0');

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  screen.getByText('1');

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  screen.getByText('2');
});

test('Set value test', async () => {
  const store = new Store({
    numbers: new Set([0]),
    add() {
      this.numbers = produce(this.numbers, (draft) => {
        const max = Math.max(...draft);

        if (max > 1) {
          return;
        }

        draft.add(max + 1);
      });
    }
  });

  let renderCount = 0;
  function Test() {
    const { numbers, add } = useStore(store);
    renderCount++;

    return (
      <>
        {[...numbers.values()].map((number) => (
          <div key={number}>{number}</div>
        ))}
        <button onClick={add}>+</button>
      </>
    );
  }

  render(<Test />);

  screen.getByText('0');

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(renderCount).toBe(2);

  screen.getByText('1');

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(renderCount).toBe(3);

  screen.getByText('2');

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(renderCount).toBe(3);
});

test('Map value test', async () => {
  const store = new Store({
    building: new Map([[0, { person: { name: 'Jack', age: 10 } }]]),
    setAge(num: number) {
      this.building = produce(this.building, (draft) => {
        const building = draft.get(0);

        if (building) {
          building.person.age = num;
        }
      });
    }
  });

  let renderCount = 0;
  function Test() {
    const { building, setAge } = useStore(store);
    renderCount++;

    return (
      <>
        {[...building.values()].map(({ person }) => (
          <div key={person.name}>{person.age}</div>
        ))}
        <button onClick={() => setAge(20)}>+</button>
      </>
    );
  }

  render(<Test />);

  screen.getByText('10');

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  screen.getByText('20');

  expect(renderCount).toBe(2);

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(renderCount).toBe(2);
});

test('Do not infinite render in get function', async () => {
  const store = new Store({
    numbers: [0, 1, 2],
    getMax() {
      return Math.max(...this.numbers);
    },
    addNumber() {
      this.numbers = [...this.numbers, 3];
    }
  });

  let renderCount = 0;
  function Test() {
    const { getMax, addNumber } = useStore(store);
    renderCount++;

    return (
      <>
        <span>{getMax()}</span>
        <button onClick={addNumber}>+</button>
      </>
    );
  }

  render(<Test />);

  expect(renderCount).toBe(1);

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(renderCount).toBe(2);

  screen.getByText('3');
});

test('Do render when get function return value change', async () => {
  const store = new Store({
    numbers: [0, 1, 2],
    getMax() {
      return Math.max(...this.numbers);
    },
    addNumber() {
      this.numbers = [...this.numbers, 3];
    }
  });

  let renderCount = 0;
  function Test() {
    const { getMax, addNumber } = useStore(store);
    renderCount++;

    return (
      <>
        <span>{getMax()}</span>
        <button onClick={addNumber}>+</button>
      </>
    );
  }

  render(<Test />);

  expect(renderCount).toBe(1);

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(renderCount).toBe(2);

  screen.getByText('3');
});
