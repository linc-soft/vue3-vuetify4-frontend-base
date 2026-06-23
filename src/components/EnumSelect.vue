<template>
  <v-select
    v-model="model"
    :clearable
    :density
    :disabled
    :hide-details
    :hint
    :item-title="displayField"
    item-value="code"
    :items="items"
    :label
    :persistent-hint
    :placeholder
    :readonly
    :variant
  >
    <template
      v-if="showSubtitle"
      #item="{ props: itemProps, item }"
    >
      <v-list-item
        v-bind="itemProps"
        :subtitle="item[oppositeField]"
        :title="item[displayField]"
      />
    </template>
  </v-select>
</template>

<script lang="ts" setup>
import type { EnumItem } from '@/api/schemas/common'
import { computed } from 'vue'

import { useEnums } from '@/composables/useEnums'

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
    displayField?: 'name' | 'code'
    showSubtitle?: boolean
    label?: string
    clearable?: boolean
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
    displayField: 'name',
    showSubtitle: false,
    clearable: false,
    density: 'compact',
    variant: 'outlined',
    hideDetails: false,
  },
)

const model = defineModel<string | number | null | undefined>()

const { items } = useEnums(props.type)

const oppositeField = computed<keyof EnumItem>(() =>
  props.displayField === 'name' ? 'code' : 'name',
)
</script>
