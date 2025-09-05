import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, test, expect } from 'vitest';
import Counter from './components/Counter.svelte';
import { Store } from '@ga-ut/store-core';

describe('Svelte component rendering', () => {
  test('increments on click', async () => {
    const store = new Store({
      count: 0,
      inc() { this.count += 1; }
    });

    render(Counter, { props: { store } });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    await userEvent.click(screen.getByRole('button', { name: 'Inc' }));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});

