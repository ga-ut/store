# ga-ut/store

Lightweight state management core with adapters for React, Vue, Svelte, and Vanilla.

## Packages

- Core: `@ga-ut/store-core` (framework-agnostic store and types)
- React adapter: `@ga-ut/store-react` (`useStore` hook)
- Vue adapter: `@ga-ut/store-vue` (`toRef`, `select`, `bindMethods`)
- Svelte adapter: `@ga-ut/store-svelte` (`toReadable`, `select`, `bindMethods`)
- Vanilla helpers: `@ga-ut/store-vanilla` (`watch`, `on`, `select`, `toObservable`)

Install only what you need. Examples below show per-framework usage.

## Features

This lightweight state management solution provides convenient syntax, strong type safety, and rendering control through framework adapters.

### Convenient Syntax

Creating and using a store is straightforward, with no need for separate setters. Simply assign values to this within the store, and pass the store to components that need rendering.

Example (React):

```tsx
import { Store } from '@ga-ut/store-core';
import { useStore } from '@ga-ut/store-react';

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

Example (React rendering behavior):

```tsx
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

You can integrate with Immer to handle immutable updates of complex state structures.

Example:

```tsx
import { Store } from '@ga-ut/store-core';
import { useStore } from '@ga-ut/store-react';
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

## Other frameworks

### Vue
```ts
import { Store } from '@ga-ut/store-core'
import { toRef, bindMethods } from '@ga-ut/store-vue'

const store = new Store({ count: 0, inc() { this.count += 1 } })
const { ref: count } = toRef(store, s => s.count, (v) => ({ value: v }))
const { inc } = bindMethods(store)
```

### Svelte
```ts
import { Store } from '@ga-ut/store-core'
import { toReadable, bindMethods } from '@ga-ut/store-svelte'

const store = new Store({ count: 0, inc() { this.count += 1 } })
const count$ = toReadable(store, s => s.count)
const { inc } = bindMethods(store)
```

### Vanilla
```ts
import { Store } from '@ga-ut/store-core'
import { watch } from '@ga-ut/store-vanilla'

const store = new Store({ count: 0, inc() { this.count += 1 } })
const un = watch(store, s => s.count, (value) => console.log('count', value))
```
