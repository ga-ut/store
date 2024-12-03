import React from 'react';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Store } from '../src';
import { useStore } from '../src/react';

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
    const { count } = useStore(countStore, ['count']);
    countRender++;
    return count;
  }

  function NopeBtn() {
    const { nope } = useStore(countStore, ['nope']);
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
    const { count } = useStore(countStore, ['count']);
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
    const { dummy } = useStore(countStore, ['dummy']);
    dummyRender++;
    return dummy;
  }

  render(
    <>
      <Count />
    </>
  );

  await userEvent.click(screen.getByRole('button', { name: '+' }));

  expect(countRender).toBe(1);
  expect(dummyRender).toBe(2);
});
