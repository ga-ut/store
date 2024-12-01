# Lightweight React State Management with Store

This lightweight state management solution for React applications offers efficient rendering control and easy integration. The key feature is the explicit declaration of `useStore` in components that need to react to state changes.

## Features

- Minimal setup and easy to use
- Efficient rendering - only components that explicitly subscribe to the store are re-rendered
- TypeScript support with proper type inference

## Installation

## Installation Instructions

You can install the `@ga-ut/store` package from the GitHub repository using the following commands:

```bash
# npm
npm install @ga-ut/store@https://github.com/ga-ut/store.git
```

```bash
# Yarn
yarn add @ga-ut/store@https://github.com/ga-ut/store.git
```

```bash
# pnpm
pnpm add @ga-ut/store@https://github.com/ga-ut/store.git
```

```bash
# Bun
bun add @ga-ut/store@https://github.com/ga-ut/store.git
```

## Usage

### Creating a Store

```typescript
import { Store } from '@ga-ut/store';

const countStore = new Store({
  count: 1,
  inc() {
    this.count += 1;
  },
  dec() {
    this.count -= 1;
  }
});
```

### Using the Store in React Components

```jsx
import React from 'react';
import { useStore } from '@ga-ut/store';

function Count() {
  useStore(countStore); // Explicitly subscribe to store changes
  return <div>{countStore.state.count}</div>;
}

function IncButton() {
  return <button onClick={countStore.state.inc}>+</button>;
}

function DecButton() {
  return <button onClick={countStore.state.dec}>-</button>;
}

function App() {
  return (
    <>
      <Count />
      <IncButton />
      <DecButton />
    </>
  );
}
```

### Using the Store with specific keys

```jsx
import React from 'react';
import { useStore } from '@ga-ut/store';

function Count() {
  useStore(countStore, ['count']);
  return <div>{countStore.state.count}</div>;
}

function IncButton() {
  return <button onClick={countStore.state.inc}>+</button>;
}

function DecButton() {
  return <button onClick={countStore.state.dec}>-</button>;
}

function App() {
  return (
    <>
      <Count />
      <IncButton />
      <DecButton />
    </>
  );
}
```

## Key Points

1. **Explicit Subscription**: Components that need to re-render on state changes must use the `useStore` hook. This allows for fine-grained control over which components re-render.

2. **Efficient Rendering**: Only components that use `useStore` will re-render when the store's state changes. This can lead to better performance in larger applications.

3. **Simple API**: The store is created with a simple object, and methods can directly modify the state.

4. **TypeScript Support**: The store and its methods are fully typed, providing excellent developer experience with autocompletion and type checking.

## Advanced Usage

### Shallow State Change Detection

The store implements shallow state change detection. This means that if a method doesn't actually change the state (like the `nope` method in the test), subscribed components won't re-render.

```typescript
const countStore = new Store({
  count: 1,
  nope() {
    this.count = this.count; // This won't trigger a re-render
  }
});
```

## Testing

The library is designed with testability in mind. You can easily test components that use the store:

```jsx
test('Count increments correctly', async () => {
  render(<App />);
  expect(screen.getByText('1')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: '+' }));
  expect(screen.getByText('2')).toBeInTheDocument();
});
```

For more detailed examples and API documentation, please refer to the source code and test files.
