<template>
  <v-autocomplete
    v-model="model"
    chips
    :clearable
    closable-chips
    :hint
    :item-title="itemTitle"
    item-value="id"
    :items="candidates"
    :label
    :menu-props
    :multiple
    :persistent-hint
    :variant
  >
    <template #chip="{ props: chipProps, item: role }">
      <v-chip
        v-bind="chipProps"
        :color="role.roleCode ? 'success' : 'info'"
        size="small"
        variant="tonal"
      >
        {{ displayName(role) }}
      </v-chip>
    </template>
    <template #item="{ props: itemProps, item: role }">
      <v-list-item
        v-bind="itemProps"
        :subtitle="describeRole(role)"
      >
        <template #prepend>
          <v-chip
            class="mr-2"
            :color="role.roleCode ? 'success' : 'info'"
            size="x-small"
            variant="tonal"
          >
            {{ badgeLabel(role.id) }}
          </v-chip>
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script lang="ts" setup>
import type { RoleListResponseItem } from '@/api/schemas/role'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useRoleDisplay } from '@/composables/useRoleDisplay'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    items: RoleListResponseItem[]
    label?: string
    hint?: string
    multiple?: boolean
    clearable?: boolean
    persistentHint?: boolean
    variant?:
      | 'filled'
      | 'outlined'
      | 'plain'
      | 'solo'
      | 'solo-filled'
      | 'solo-inverted'
      | 'underlined'
    excludeId?: number | null
    menuProps?: object
  }>(),
  {
    multiple: true,
    clearable: true,
    persistentHint: true,
    variant: 'outlined',
    menuProps: () => ({ maxWidth: '100%' }),
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void
}>()

const { t } = useI18n()
const { displayName } = useRoleDisplay()

const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value as number[]),
})

const roleMap = computed(
  () => new Map<number, RoleListResponseItem>(props.items.map(r => [r.id, r])),
)

const candidates = computed(() =>
  props.excludeId == null ? props.items : props.items.filter(r => r.id !== props.excludeId),
)

function itemTitle(role: RoleListResponseItem): string {
  return displayName(role)
}

function isBaseRoleId(id: number | undefined): boolean {
  return id != null && !!roleMap.value.get(id)?.roleCode
}

function badgeLabel(id: number | undefined): string {
  return isBaseRoleId(id) ? t('role.form.badgeBase') : t('role.form.badgeComposite')
}

function describeRole(r: RoleListResponseItem): string {
  if (r.roleCode) {
    return `${t('role.form.roleCode')}: ${r.roleCode}`
  }
  if (r.parentRoleIds.length === 0) {
    return t('role.form.noParents')
  }

  const prefix = `${t('role.form.inheritsFrom')}: `
  const names = r.parentRoleIds.map(pid => {
    const parent = roleMap.value.get(pid)
    return parent ? displayName(parent) : `#${pid}`
  })
  const maxItems = 4
  const maxContentLength = 60

  let content = names[0]
  let displayed = 1

  for (let i = 1; i < names.length && i < maxItems; i++) {
    const next = `${content}, ${names[i]}`
    if (next.length > maxContentLength) break
    content = next
    displayed++
  }

  if (displayed < names.length) {
    content += `, ...(${names.length - displayed})`
  }

  return prefix + content
}
</script>
