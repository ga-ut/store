<script>
  import { toReadable, bindMethods } from '../../src';
  export let store;
  const count$ = toReadable(store, (s) => s.count);
  const { inc } = bindMethods(store);
</script>

<button on:click={inc}>Inc</button>
<div data-testid="count">{$count$}</div>
