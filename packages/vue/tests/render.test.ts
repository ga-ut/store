import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import TestComp from './components/Test.vue';
import { Store } from '@ga-ut/store-core';

describe('Vue component rendering', () => {
  test('increments on click', async () => {
    const store = new Store({
      count: 0,
      inc() { this.count += 1; }
    });
    render(TestComp, { props: { store } });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    await userEvent.click(screen.getByRole('button', { name: 'Inc' }));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});

