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

```jsx
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

The store provides strong type safety for state access and mutations:

```typescript
// ❌ Type Error: Cannot access non-existent property
const store = new Store({ count: 0 });
store.getState().nonexistent; // Error: Property 'nonexistent' does not exist

// ❌ Type Error: Cannot assign wrong type
store.getState().count = "1"; // Error: Type 'string' is not assignable to type 'number'

// ❌ Type Error: Cannot reference other methods inside a method
const store = new Store({
  count: 0,
  increment() {
    this.count += 1;
  },
  double() {
    this.increment(); // Error: Property 'increment' does not exist on type '{ count: number }'
    this.count *= 2;
  }
});

// ✅ Correct: Methods should be self-contained
const store = new Store({
  count: 0,
  increment() {
    this.count += 1;
  },
  double() {
    this.count *= 2;
  }
});
```

### Rendering Optimization

The store automatically optimizes rendering performance. Components will only re-render when their specifically accessed store values change, ensuring efficient updates.

Example:

```jsx
function Counter() {
  // Re-renders only when 'count' changes
  const { count } = useStore(countStore);
  return <p>Count: {count}</p>;
}

function Controls() {
  // Re-renders when any accessed state changes
  const { increment, decrement } = useStore(countStore);
  return (
    <div>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

// Getter functions are also optimized
const statsStore = new Store({
  numbers: [1, 2, 3],
  getMax() {
    // Re-renders only when 'numbers' array changes
    return Math.max(...this.numbers);
  },
  addNumber(num) {
    this.numbers = [...this.numbers, num];
  }
});

function Stats() {
  const { getMax, addNumber } = useStore(statsStore);
  return (
    <div>
      <p>Maximum: {getMax()}</p>
      <button onClick={() => addNumber(4)}>Add 4</button>
    </div>
  );
}
```

In the example above, the `Stats` component will only re-render when the `numbers` array changes, even though it's using a getter function. The store automatically tracks dependencies used within getter functions and optimizes rendering accordingly.

### Using Immer for Immutable Updates

@ga-ut/store can be seamlessly integrated with Immer to handle immutable updates of complex state structures. This is particularly useful when dealing with nested objects or collections.

Example:

```jsx
import { Store, useStore } from '@ga-ut/store';
import { produce } from 'immer';

interface Address {
  city: string;
  zip: string;
}

interface Contact {
  email: string;
  phone: string;
}

interface Person {
  name: string;
  age: number;
  address: Address;
  contact: Contact;
  updateUserProfile(newCity: string, newPhone: string): void;
}

const personStore = new Store<Person>({
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
  const { address, contact, updateUserProfile } = useStore(personStore);

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
