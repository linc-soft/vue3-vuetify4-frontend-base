import type { Directive, DirectiveBinding } from 'vue'
import { usePermissionStore } from '@/stores/permission'

type PermValue = string | string[] | { any?: string[]; all?: string[] }

function check(value: PermValue): boolean {
  const store = usePermissionStore()
  if (typeof value === 'string') return store.has(value)
  if (Array.isArray(value)) return store.hasAny(value)
  if (value.all?.length) return store.hasAll(value.all)
  if (value.any?.length) return store.hasAny(value.any)
  return true
}

function apply(el: HTMLElement, binding: DirectiveBinding<PermValue>) {
  if (binding.value == null) return
  if (!check(binding.value)) {
    el.remove()
  }
}

export const vPerm: Directive<HTMLElement, PermValue> = {
  mounted: apply,
  updated: apply,
}
