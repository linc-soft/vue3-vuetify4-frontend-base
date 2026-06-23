<template>
  <v-select
    v-model="model"
    :chips
    :clearable
    :closable-chips="chips"
    :density
    :disabled
    :hide-details
    :hint
    item-title="label"
    item-value="value"
    :items
    :label
    :multiple
    :persistent-hint
    :placeholder
    :readonly
    :variant
  >
    <template
      v-if="hasDescription"
      #item="{ props: itemProps, item }"
    >
      <v-list-item
        v-bind="itemProps"
        :subtitle="item.description ?? undefined"
        :title="item.label"
      />
    </template>
  </v-select>
</template>

<script lang="ts" setup>
import type { SelectOption } from '@/api/schemas/common'
import { computed } from 'vue'

import { useSelectOptions } from '@/composables/useSelectOptions'

type Density = 'default' | 'comfortable' | 'compact' | undefined
type Variant =
  | 'filled'
  | 'outlined'
  | 'plain'
  | 'solo'
  | 'solo-filled'
  | 'solo-inverted'
  | 'underlined'
  | undefined

const props = withDefaults(
  defineProps<{
    type: string
    label?: string
    multiple?: boolean
    clearable?: boolean
    chips?: boolean
    density?: Density
    variant?: Variant
    hideDetails?: boolean | 'auto'
    hint?: string
    persistentHint?: boolean
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
  }>(),
  {
    multiple: false,
    clearable: false,
    chips: false,
    density: 'compact',
    variant: 'outlined',
    hideDetails: false,
  },
)

const model = defineModel<string | number | (string | number)[] | null | undefined>()

const { items } = useSelectOptions(props.type)

const hasDescription = computed(() =>
  items.value.some((it: SelectOption) => it.description != null && it.description !== ''),
)
</script>
