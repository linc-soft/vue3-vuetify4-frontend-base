import type { SelectOption } from '@/api/schemas/common'
import { computed, ref, type Ref } from 'vue'
import { getSelectOptions } from '@/api/modules/common'

const cache = new Map<string, Ref<SelectOption[]>>()
const pending = new Set<string>()

async function load(type: string) {
  pending.add(type)
  try {
    const list = await getSelectOptions(type)
    const existing = cache.get(type)
    if (existing) {
      existing.value = list
    } else {
      cache.set(type, ref(list))
    }
  } catch (error) {
    console.error(`Failed to load select-options [${type}]:`, error)
  } finally {
    pending.delete(type)
  }
}

/**
 * Composable that returns a reactive select-option list for the given `type`.
 *
 * - `options` maps items to `{ title, value }` for use with `v-select` / `v-autocomplete`.
 * - `labelOf` resolves a value back to its display label.
 */
export function useSelectOptions(type: string) {
  if (!cache.has(type)) {
    cache.set(type, ref([]))
    load(type)
  }

  const itemsRef = cache.get(type)!

  const items = computed<SelectOption[]>(() => itemsRef.value)

  const options = computed(() =>
    items.value.map(item => ({ title: item.label, value: item.value })),
  )

  const labelOf = (value: string | number) =>
    items.value.find(i => String(i.value) === String(value))?.label ?? String(value)

  return { items, options, labelOf }
}
