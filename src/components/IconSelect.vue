<template>
  <v-text-field
    v-model="displayValue"
    :density
    :label
    readonly
    :variant
    @click="openMenu"
  >
    <template #prepend-inner>
      <v-icon
        v-if="modelValue"
        :icon="modelValue"
      />
    </template>
    <template #append-inner>
      <v-icon icon="mdi-chevron-down" />
    </template>
    <v-menu
      v-model="menuOpen"
      activator="parent"
      :close-on-content-click="false"
      location="bottom start"
      max-height="420"
      offset="4"
    >
      <v-card width="360">
        <v-card-text class="pa-3">
          <v-text-field
            v-model="keyword"
            autofocus
            clearable
            density="compact"
            hide-details
            :placeholder="t('iconSelect.search')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
          />
          <v-virtual-scroll
            v-if="filteredRows.length > 0"
            class="mt-3"
            :height="320"
            :item-height="48"
            :items="filteredRows"
          >
            <template #default="{ item: row }">
              <div class="d-flex justify-space-between">
                <v-btn
                  v-for="name in row"
                  :key="name"
                  class="flex-grow-1 mx-1"
                  size="small"
                  :title="`mdi-${name}`"
                  variant="text"
                  @click="handleSelect(name)"
                >
                  <v-icon
                    :icon="`mdi-${name}`"
                    size="large"
                  />
                </v-btn>
                <span
                  v-for="i in columnsPerRow - row.length"
                  :key="`placeholder-${row[0]}-${i}`"
                  class="flex-grow-1 mx-1"
                />
              </div>
            </template>
          </v-virtual-scroll>
          <div
            v-else
            class="text-medium-emphasis text-center py-8"
          >
            {{ t('iconSelect.empty') }}
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="px-3 py-2">
          <a
            href="https://pictogrammers.com/library/mdi/"
            rel="noopener noreferrer"
            target="_blank"
          >
            {{ t('iconSelect.browse') }}
          </a>
          <v-spacer />
          <v-btn
            size="small"
            variant="text"
            @click="handleClear"
          >
            {{ t('iconSelect.clear') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </v-text-field>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import iconsJson from '@/assets/mdi-icons.json'

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
    modelValue: string | null
    label?: string
    clearable?: boolean
    density?: Density
    variant?: Variant
  }>(),
  {
    clearable: true,
    density: 'compact',
    variant: 'outlined',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const { t } = useI18n()

const menuOpen = ref(false)
const keyword = ref('')
const columnsPerRow = 6

const iconNames = iconsJson.icons

const strippedKeyword = computed(() => keyword.value.trim().toLowerCase().replace(/^mdi-/, ''))

const filtered = computed(() => {
  if (!strippedKeyword.value) return iconNames
  return iconNames.filter(name => name.includes(strippedKeyword.value))
})

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size))
  }
  return result
}

const filteredRows = computed(() => chunk(filtered.value, columnsPerRow))

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.replace(/^mdi-/, '')
})

function openMenu() {
  menuOpen.value = true
}

function handleSelect(name: string) {
  emit('update:modelValue', `mdi-${name}`)
  menuOpen.value = false
  keyword.value = ''
}

function handleClear() {
  emit('update:modelValue', null)
  keyword.value = ''
}

watch(menuOpen, open => {
  if (open) {
    keyword.value = ''
  }
})
</script>
