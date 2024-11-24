import React from 'react';
import { useStore, Store } from '../src';
import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

const countStore = new Store({
  count: 1,
  inc() {
    countStore.setState(({ count }) => ({ count: count + 1 }));
  },
  dec() {
    countStore.setState(({ count }) => ({ count: count - 1 }));
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
    useStore(countStore);
    countRender++;
    return countStore.state.count;
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
});
