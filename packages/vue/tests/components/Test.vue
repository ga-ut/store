<script setup lang="ts">
import { shallowRef } from 'vue'
import type { Store } from '@ga-ut/store-core'
import { toRef, bindMethods } from '../../src'

const props = defineProps<{ store: Store<{ count: number; inc(): void }> }>()
const { ref: count } = toRef(props.store, (s) => s.count, shallowRef)
const { inc } = bindMethods(props.store) as { inc: () => void }
</script>

<template>
  <button @click="inc">Inc</button>
  <div data-testid="count">{{ count }}</div>
</template>
