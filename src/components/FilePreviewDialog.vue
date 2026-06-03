<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="isPdf && fullscreen"
    :max-width="isPdf ? '90vw' : 600"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <span class="text-truncate">{{ originalFilename }}</span>
        <v-spacer />
        <v-btn
          v-if="isPdf"
          icon="mdi-arrow-expand"
          size="small"
          variant="text"
          @click="fullscreen = !fullscreen"
        />
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="close"
        />
      </v-card-title>
      <v-divider />
      <v-card-text
        class="pa-0"
        :style="contentStyle"
      >
        <div
          v-if="loading"
          class="d-flex justify-center align-center"
          style="height: 400px"
        >
          <v-progress-circular
            color="primary"
            indeterminate
          />
        </div>
        <div
          v-else-if="error"
          class="d-flex flex-column align-center justify-center"
          style="height: 400px"
        >
          <v-icon
            color="error"
            size="64"
            >mdi-alert-circle-outline</v-icon
          >
          <p class="mt-4 text-body-1">{{ t('filePreview.loadFailed') }}</p>
        </div>
        <template v-else-if="isImage">
          <v-img
            :alt="originalFilename"
            contain
            max-height="70vh"
            :src="previewUrl"
          />
        </template>
        <template v-else-if="isPdf">
          <iframe
            class="pdf-frame"
            :src="previewUrl"
          />
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleDownload"
        >
          <v-icon start>mdi-download</v-icon>
          {{ t('filePreview.download') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { downloadFile } from '@/api/modules/file'

const FILE_TYPE_IMAGE = 1
const FILE_TYPE_DOCUMENT = 2

const props = defineProps<{
  modelValue: boolean
  fileType: number
  dateUrl: string
  storedName: string
  originalFilename: string
  contentType: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()

const dialog = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})
const loading = ref(false)
const error = ref(false)
const previewUrl = ref('')
const fullscreen = ref(false)

const isImage = computed(() => props.fileType === FILE_TYPE_IMAGE)
const isPdf = computed(
  () =>
    props.fileType === FILE_TYPE_DOCUMENT &&
    (props.contentType?.includes('pdf') || props.originalFilename?.toLowerCase().endsWith('.pdf')),
)

const contentStyle = computed(() => {
  if (isPdf.value && fullscreen.value) return { height: 'calc(100vh - 120px)' }
  if (isPdf.value) return { height: '75vh' }
  return {}
})

async function loadFile() {
  if (!props.dateUrl || !props.storedName) return
  loading.value = true
  error.value = false
  try {
    const { blob } = await downloadFile(props.dateUrl, props.storedName)
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    const typedBlob = new Blob([blob], { type: props.contentType || 'application/pdf' })
    previewUrl.value = URL.createObjectURL(typedBlob)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function close() {
  dialog.value = false
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
  fullscreen.value = false
}

async function handleDownload() {
  try {
    const { blob } = await downloadFile(props.dateUrl, props.storedName)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.originalFilename
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    // download failed silently
  }
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      fullscreen.value = false
      loadFile()
    }
  },
)
</script>

<style scoped>
.pdf-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
