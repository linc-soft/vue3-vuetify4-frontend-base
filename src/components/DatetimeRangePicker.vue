<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    location="bottom start"
  >
    <template #activator="{ props: menuProps }">
      <v-text-field
        v-bind="menuProps"
        v-model="displayValue"
        clearable
        :density="density"
        :disabled="disabled"
        hide-details
        :label="label"
        readonly
        :variant="variant"
      />
    </template>
    <VueDatePicker
      :dark="isDark"
      :disabled="disabled"
      :formats="{ input: format, preview: format }"
      inline
      :locale="loadedLocale"
      :max-date="maxDate"
      :min-date="minDate"
      :model-value="internalValue"
      range
      :time-config="timeConfig"
      year-first
      @update:model-value="handleUpdate"
    />
  </v-menu>
</template>

<script lang="ts" setup>
import type { Locale } from 'date-fns'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useLocale } from '@/composables/useLocale'
import '@vuepic/vue-datepicker/dist/main.css'

/**
 * Datetime range picker component based on @vuepic/vue-datepicker
 * Provides a unified interface for selecting start and end datetime
 */

export interface DatetimeRange {
  startTime: string | null
  endTime: string | null
}

// Lazy load locales
const loadedLocale = ref<Locale | undefined>(undefined)

const props = withDefaults(
  defineProps<{
    /** v-model binding object with startTime and endTime */
    modelValue: DatetimeRange | null
    /** Label text displayed above the input */
    label?: string
    /** Whether the picker is clearable */
    clearable?: boolean
    /** Whether the picker is disabled */
    disabled?: boolean
    /** Date format for display */
    format?: string
    /** Maximum selectable date */
    maxDate?: Date | string
    /** Minimum selectable date */
    minDate?: Date | string
    /** Density of the input field */
    density?: 'default' | 'comfortable' | 'compact'
    /** Variant of the input field */
    variant?: 'outlined' | 'filled' | 'underlined' | 'solo' | 'plain'
  }>(),
  {
    label: '选择时间范围',
    clearable: true,
    disabled: false,
    format: 'yyyy/MM/dd HH:mm:ss',
    maxDate: undefined,
    minDate: undefined,
    density: 'compact',
    variant: 'outlined',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: DatetimeRange | null]
}>()

const theme = useTheme()
const { current: locale } = useLocale()
const menuOpen = ref(false)

const isDark = computed(() => theme.global.current.value.dark)

// Default time configuration for range picker
// Start time: 00:00:00, End time: 23:59:59
const timeConfig = {
  enableSeconds: true,
  timePickerInline: true,
  startTime: [
    { hours: 0, minutes: 0, seconds: 0 }, // Start time: 00:00:00
    { hours: 23, minutes: 59, seconds: 59 }, // End time: 23:59:59
  ],
}

// Internal value for vue-datepicker
const internalValue = ref<[Date, Date] | null>(null)

// Sync internal value with modelValue prop
watch(
  () => props.modelValue,
  newValue => {
    if (!newValue?.startTime && !newValue?.endTime) {
      internalValue.value = null
      return
    }
    const dates: [Date, Date] = [new Date(), new Date()]
    if (newValue.startTime) {
      dates[0] = new Date(newValue.startTime)
    }
    if (newValue.endTime) {
      dates[1] = new Date(newValue.endTime)
    }
    internalValue.value = dates
  },
  { immediate: true },
)

// Display value for v-text-field
const displayValue = computed({
  get: () => {
    if (!internalValue.value || !internalValue.value[0] || !internalValue.value[1]) {
      return menuOpen.value ? ' ' : ''
    }
    const start = formatDateDisplay(internalValue.value[0])
    const end = formatDateDisplay(internalValue.value[1])
    return `${start} - ${end}`
  },
  set: (value: string | null) => {
    if (value === null || value === '') {
      emit('update:modelValue', null)
    }
  },
})

// Map application locale to vue-datepicker locale codes
const localeCode = computed(() => {
  const localeMap: Record<string, string> = {
    en: 'en',
    zh: 'zh',
    ja: 'ja',
  }
  return localeMap[locale.value] || 'ja'
})

// Dynamic locale loading
watch(
  localeCode,
  async code => {
    try {
      const locales: Record<string, () => Promise<Locale>> = {
        zh: () => import('date-fns/locale/zh-CN').then(m => m.zhCN),
        en: () => import('date-fns/locale/en-US').then(m => m.enUS),
        ja: () => import('date-fns/locale/ja').then(m => m.ja),
      }
      if (locales[code]) {
        loadedLocale.value = await locales[code]()
      }
    } catch {
      loadedLocale.value = undefined
    }
  },
  { immediate: true },
)

// Handle update from vue-datepicker
function handleUpdate(value: [Date, Date] | null) {
  if (!value) {
    internalValue.value = null
    emit('update:modelValue', null)
  } else if (value[1]) {
    internalValue.value = value
    emit('update:modelValue', {
      startTime: formatDateTime(value[0]),
      endTime: formatDateTime(value[1]),
    })
  } else {
    internalValue.value = [value[0], value[0]]

    emit('update:modelValue', {
      startTime: formatDateTime(value[0]),
      endTime: formatDateTime(value[0]),
    })
  }

  // Close the menu after selection
  menuOpen.value = false
}

// Format date for display using the format prop
function formatDateDisplay(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // Parse format prop and replace placeholders
  return props.format
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

// Format date to 'yyyy-MM-ddTHH:mm:ss' format
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}
</script>

<style scoped>
/* Customize vue-datepicker styles for inline mode */
:deep(.dp__main) {
  --dp-font-family: 'Roboto', sans-serif;
  --dp-border-radius: 4px;
}

:deep(.dp__theme_light) {
  --dp-background-color: #fff;
  --dp-text-color: #212121;
  --dp-hover-color: #f5f5f5;
  --dp-primary-color: #1976d2;
  --dp-border-color: #e0e0e0;
}

:deep(.dp__theme_dark) {
  --dp-background-color: #1e1e1e;
  --dp-text-color: #fff;
  --dp-hover-color: #484848;
  --dp-primary-color: #1976d2;
  --dp-border-color: #424242;
}

/* Remove input border in inline mode */
:deep(.dp__input) {
  border: none;
  padding: 8px 12px;
}
</style>
