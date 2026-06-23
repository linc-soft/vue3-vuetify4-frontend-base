<template>
  <v-autocomplete
    v-model="model"
    :clearable
    :density
    :hide-details
    item-value="code"
    :items="roleCodeItems"
    :label
    :variant
  >
    <template #selection="{ item }">
      {{ item.code }}
    </template>
    <template #item="{ props: itemProps, item }">
      <v-list-item
        v-bind="itemProps"
        :subtitle="item.name"
        :title="item.code"
      />
    </template>
  </v-autocomplete>
</template>

<script lang="ts" setup>
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
    modelValue: string | number | null | undefined
    label?: string
    clearable?: boolean
    density?: Density
    variant?: Variant
    hideDetails?: boolean
  }>(),
  {
    clearable: true,
    density: 'compact',
    variant: 'outlined',
    hideDetails: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null | undefined): void
}>()

const { items: roleCodeItems } = useEnums('role-code')

const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>
