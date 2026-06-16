<template>
  <v-autocomplete
    v-model="model"
    :chips="chips"
    :clearable
    :closable-chips="chips"
    :density
    :hide-details
    item-title="title"
    item-value="value"
    :items="options"
    :label
    :multiple
    :variant
  />
</template>

<script lang="ts" setup>
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
    modelValue: string | number | (string | number)[] | null
    valueKey?: 'id' | 'username'
    label?: string
    multiple?: boolean
    clearable?: boolean
    chips?: boolean
    density?: Density
    variant?: Variant
    hideDetails?: boolean
  }>(),
  {
    valueKey: 'id',
    multiple: false,
    clearable: true,
    chips: false,
    density: 'default',
    variant: 'outlined',
    hideDetails: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | (string | number)[] | null): void
}>()

const optionType = computed(() => (props.valueKey === 'username' ? 'username' : 'user'))
const { options } = useSelectOptions(optionType.value)

const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>
