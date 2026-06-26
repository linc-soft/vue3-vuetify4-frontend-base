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
    <v-dialog
      v-model="menuOpen"
      :max-width="420"
      scrollable
    >
      <v-card width="420">
        <v-card-text class="pa-3">
          <v-text-field
            v-model="keyword"
            autofocus
            clearable
            density="compact"
            hide-details
            persistent-clear
            :placeholder="t('iconSelect.search')"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            @click:clear="keyword = ''"
          />
          <v-virtual-scroll
            v-if="filteredRows.length > 0"
            class="mt-3"
            :height="360"
            :item-height="104"
            :items="filteredRows"
          >
            <template #default="{ item: row }">
              <div class="icon-select__row">
                <v-btn
                  v-for="name in row"
                  :key="name"
                  class="icon-select__cell"
                  height="96"
                  :title="`mdi-${name}`"
                  variant="text"
                  @click="handleSelect(name)"
                >
                  <div class="icon-select__inner d-flex flex-column align-center justify-center">
                    <v-icon
                      :icon="`mdi-${name}`"
                      size="36"
                    />
                    <span class="icon-select__name mt-1 text-caption text-medium-emphasis">
                      {{ name }}
                    </span>
                  </div>
                </v-btn>
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
    </v-dialog>
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
const columnsPerRow = 4

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

<style lang="scss" scoped>
.icon-select__row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.icon-select__cell {
  width: 100%;
  min-width: 0;
  height: 96px;
  padding-right: 2px;
  padding-left: 2px;

  :deep(.v-btn__content) {
    flex: 1 1 100%;
    width: 100%;
    min-width: 0;
    white-space: normal;
  }
}

.icon-select__inner {
  flex: 1 1 100%;
  width: 100%;
  min-width: 0;
}

.icon-select__name {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
</style>
