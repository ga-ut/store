# ga-ut/store

Lightweight React State Management with Store

## Installation

You can install the `@ga-ut/store` package from the GitHub repository using the following commands:

```bash
# npm
npm install @ga-ut/store
```

```bash
# Yarn
yarn add @ga-ut/store
```

```bash
# pnpm
pnpm add @ga-ut/store
```

```bash
# Bun
bun add @ga-ut/store
```

## Features

This lightweight state management solution for React applications offers convenient syntax, type safety, and optimized rendering control. Here's an overview of its key features:

### Convenient Syntax

Creating and using a store is straightforward, with no need for separate setters. Simply assign values to this within the store, and pass the store to components that need rendering.

Example:

```tsx
import { Store, useStore } from '@ga-ut/store';

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
  const { count, increment, decrement } = useStore(countStore);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

### Type Safety

The store's state can only be manipulated within the store itself, thanks to TypeScript type settings. Attempting to directly assign values from outside the store will result in TypeScript errors, ensuring safer maintenance of global state.

Example:

```tsx
const countStore = new Store({
  count: 0,
  increment() {
    this.count += 1; // This is allowed
  },
  reset() {
    // this.increment(); // This will cause a TypeScript error if uncommented
    // Function properties cannot be accessed here
  }
});

function Counter() {
  // Attempting to destructure 'increment' will result in a TypeScript error
  // because it is not included in the dependency array.
  const { increment } = useStore(countStore, ['count']); // Only 'count' is specified

  return (
    <div>
      <button onClick={increment}>Increment</button>
    </div>
  );
}

// This will cause a TypeScript error
countStore.state.count = 5; // Error: Cannot assign to 'count' because it is a read-only property.
```

### Rendering Optimization

You can optimize rendering by specifying which store keys should trigger re-renders. This is optional; if not specified, any internal function call will cause a full re-render.

Example:

```tsx
function Counter() {
  // Only re-render when 'count' changes
  const { count } = useStore(countStore, ['count']);
  return <p>Count: {count}</p>;
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

### Using Immer for Immutable Updates

@ga-ut/store can be seamlessly integrated with Immer to handle immutable updates of complex state structures. This is particularly useful when dealing with nested objects or collections.

Example:

```jsx
import { Store, useStore } from '@ga-ut/store';
import { produce } from 'immer';

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

function UserProfile() {
  const { address, contact, updateUserProfile } = useStore(personStore, [
    'address',
    'contact',
    'updateUserProfile'
  ]);

  return (
    <>
      <span>{address.city}</span>
      <span>{contact.phone}</span>
      <button onClick={() => updateUserProfile('Seoul', '012-345-6789')}>
        Update Profile
      </button>
    </>
  );
}
```

For more detailed examples and API documentation, please refer to the source code and test files.
