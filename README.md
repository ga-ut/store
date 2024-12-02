# ga-ut/store
Lightweight React State Management with Store

## Installation
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

## Features
This lightweight state management solution for React applications offers convenient syntax, type safety, and optimized rendering control. Here's an overview of its key features:

### Convenient Syntax
Creating and using a store is straightforward, with no need for separate setters. Simply assign values to this within the store, and pass the store to components that need rendering.

Example:

```typescript
import { Store } from '@ga-ut/store';

const countStore = new Store({
  count: 0,
  increment() {
    this.count += 1;
  },
  decrement() {
    this.count -= 1;
  }
});

function Counter() {
  useStore(countStore);
  return (
    <div>
      <p>Count: {countStore.state.count}</p>
      <button onClick={countStore.state.increment}>+</button>
      <button onClick={countStore.state.decrement}>-</button>
    </div>
  );
}
```

### Type Safety
The store's state can only be manipulated within the store itself, thanks to TypeScript type settings. Attempting to directly assign values from outside the store will result in TypeScript errors, ensuring safer maintenance of global state.

Example:

```typescript
const countStore = new Store({
  count: 0,
  increment() {
    this.count += 1; // This is allowed
  }
});

// This will cause a TypeScript error
countStore.state.count = 5; // Error: Cannot assign to 'count' because it is a read-only property.
```

### Rendering Optimization
You can optimize rendering by specifying which store keys should trigger re-renders. This is optional; if not specified, any internal function call will cause a full re-render.

Example:
```typescript
function Counter() {
  // Only re-render when 'count' changes
  useStore(countStore, ['count']);
  return <p>Count: {countStore.state.count}</p>;
}

function Controls() {
  // This component won't re-render on state changes
  return (
    <div>
      <button onClick={countStore.state.increment}>+</button>
      <button onClick={countStore.state.decrement}>-</button>
    </div>
  );
}
```

For more detailed examples and API documentation, please refer to the source code and test files.
