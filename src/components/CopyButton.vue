<template>
  <v-btn
    v-if="!label"
    v-bind="$attrs"
    :color="copied ? 'success' : undefined"
    :density="density"
    :icon="currentIcon"
    :size="size"
    :variant="variant"
    @click="handleCopy"
  />
  <v-btn
    v-else
    v-bind="$attrs"
    :color="copied ? 'success' : undefined"
    :density="density"
    :prepend-icon="currentIcon"
    :size="size"
    :variant="variant"
    @click="handleCopy"
  >
    {{ label }}
  </v-btn>
  <v-snackbar
    v-model="showSnackbar"
    color="success"
    :location="snackbarLocation as any"
    :timeout="successDuration"
  >
    {{ displayMessage }}
  </v-snackbar>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    text: string
    label?: string
    icon?: string
    successIcon?: string
    size?: string
    density?: 'default' | 'comfortable' | 'compact'
    variant?: 'text' | 'tonal' | 'flat' | 'outlined' | 'elevated' | 'plain'
    successDuration?: number
    successMessage?: string
    snackbarLocation?: string
  }>(),
  {
    icon: 'mdi-content-copy',
    successIcon: 'mdi-check',
    size: 'small',
    density: 'compact',
    variant: 'text',
    successDuration: 3000,
    snackbarLocation: 'top end',
  },
)

const emit = defineEmits<{
  copied: [text: string]
  error: [err: unknown]
}>()

const { t } = useI18n()
const copied = ref(false)
const showSnackbar = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const currentIcon = computed(() => (copied.value ? props.successIcon : props.icon))
const displayMessage = computed(() => props.successMessage ?? t('common.copySuccess'))

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    showSnackbar.value = true
    emit('copied', props.text)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, props.successDuration)
  } catch (error) {
    emit('error', error)
  }
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
