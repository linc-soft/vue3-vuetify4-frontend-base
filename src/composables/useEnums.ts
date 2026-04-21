import type { EnumItem } from '@/api/schemas/common'
import { computed, ref, type Ref } from 'vue'
import { getEnums } from '@/api/modules/common'

/** Per-type cache of loaded enum lists (module-level, shared across all callers) */
const cache = new Map<string, Ref<EnumItem[]>>()
/** Tracks in-flight requests to avoid duplicate fetches */
const pending = new Set<string>()

/**
 * Fetch enum list from the backend and write the result into the
 * existing Ref inside `cache` so that any computed depending on
 * that Ref is automatically re-evaluated by Vue's reactivity system.
 */
async function loadEnums(type: string) {
  pending.add(type)
  try {
    const list = await getEnums(type)
    const existing = cache.get(type)
    if (existing) {
      existing.value = list
    } else {
      cache.set(type, ref(list))
    }
  } catch (error) {
    console.error(`Failed to load enums [${type}]:`, error)
  } finally {
    pending.delete(type)
  }
}

/**
 * Composable that returns a reactive enum list for the given `type`.
 *
 * - Each `type` is fetched only once; subsequent calls return the cached Ref.
 * - `options` maps items to `{ title, value }` for use with `v-select`.
 *   `code` is coerced to string to prevent type mismatches when the
 *   backend returns numeric codes.
 * - `labelOf` resolves a code back to its display name.
 */
export function useEnums(type: string) {
  if (!cache.has(type)) {
    cache.set(type, ref([]))
    loadEnums(type)
  }

  /*
   * Hold a direct reference to the cached Ref instead of calling
   * `cache.get(type)` inside the computed. Map.get() is not reactive,
   * so Vue cannot track it as a dependency. By capturing the Ref in a
   * local variable, the computed reads `itemsRef.value` directly,
   * which Vue can track and re-evaluate when loadEnums updates it.
   */
  const itemsRef = cache.get(type)!

  const items = computed<EnumItem[]>(() => itemsRef.value)

  const options = computed(() =>
    items.value.map(item => ({ title: item.name, value: String(item.code) })),
  )

  const labelOf = (code: string | number) =>
    items.value.find(i => String(i.code) === String(code))?.name ?? String(code)

  return { items, options, labelOf }
}
