<template>
  <div class="json-viewer">
    <div class="d-flex align-center mb-2">
      <v-btn
        density="compact"
        :prepend-icon="expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        size="small"
        variant="text"
        @click="expanded = !expanded"
      >
        {{ expanded ? t('log.common.collapse') : t('log.common.expand') }}
      </v-btn>
      <v-btn
        class="ml-2"
        :color="copied ? 'success' : undefined"
        density="compact"
        :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
        size="small"
        variant="text"
        @click="copyToClipboard"
      >
        {{ t('log.common.copy') }}
      </v-btn>
    </div>
    <v-expand-transition>
      <pre
        v-show="expanded"
        class="json-content pa-3 rounded"
        :style="{ maxHeight: maxHeight }"
        >{{ formattedJson }}</pre
      >
    </v-expand-transition>
    <v-snackbar
      v-model="showSnackbar"
      color="success"
      location="top end"
      :timeout="3000"
    >
      {{ t('log.common.copySuccess') }}
    </v-snackbar>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    data: string | object | null | undefined
    maxHeight?: string
  }>(),
  {
    maxHeight: '300px',
  },
)

const { t } = useI18n()
const expanded = ref(true)
const copied = ref(false)
const showSnackbar = ref(false)

const formattedJson = computed(() => {
  if (!props.data) return ''
  try {
    const obj = typeof props.data === 'string' ? JSON.parse(props.data) : props.data
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(props.data)
  }
})

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    copied.value = true
    showSnackbar.value = true
    setTimeout(() => {
      copied.value = false
    }, 3000)
  } catch {
    // Silently fail
  }
}
</script>

<style scoped>
.json-viewer {
  font-size: 0.875rem;
}

.json-content {
  background-color: rgb(var(--v-theme-surface-variant));
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>
