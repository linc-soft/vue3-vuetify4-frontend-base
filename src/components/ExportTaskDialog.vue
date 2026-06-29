<template>
  <v-dialog
    max-width="480"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('log.export.title') }}</v-card-title>

      <v-card-text>
        <div
          v-if="isPolling"
          class="d-flex flex-column align-center ga-4 py-4"
        >
          <v-progress-circular
            color="primary"
            indeterminate
            size="48"
          />
          <div class="text-body-1">
            {{ statusText }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ t('log.export.pollingHint') }}
          </div>
        </div>

        <div
          v-else-if="isSuccess"
          class="d-flex flex-column align-center ga-4 py-4"
        >
          <v-icon
            color="success"
            size="48"
          >
            mdi-check-circle
          </v-icon>
          <div class="text-body-1 text-success">
            {{ statusText }}
          </div>
          <div
            v-if="fileInfo"
            class="text-caption"
          >
            {{ fileInfo }}
          </div>
        </div>

        <v-alert
          v-else-if="isFailed"
          :text="task?.errorMessage ?? t('log.export.status.FAILED')"
          type="error"
          variant="tonal"
        />

        <div
          v-else-if="task?.status === 'EXPIRED'"
          class="d-flex flex-column align-center ga-4 py-4"
        >
          <v-icon
            color="warning"
            size="48"
          >
            mdi-clock-alert-outline
          </v-icon>
          <div class="text-body-1">
            {{ statusText }}
          </div>
        </div>

        <v-alert
          v-if="error"
          class="mt-2"
          :text="error"
          type="error"
          variant="tonal"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="isFailed || task?.status === 'EXPIRED'"
          variant="text"
          @click="handleClose"
        >
          {{ t('log.export.close') }}
        </v-btn>
        <v-btn
          v-if="isSuccess"
          color="primary"
          :loading="downloading"
          variant="tonal"
          @click="handleDownload"
        >
          {{ t('log.export.download') }}
        </v-btn>
        <v-btn
          v-if="isSuccess"
          variant="text"
          @click="handleClose"
        >
          {{ t('log.export.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { ExportTask } from '@/api/schemas/exportTask'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { downloadExportTask, getExportTask } from '@/api/modules/exportTask'

const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
  taskId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  downloaded: []
}>()

const task = ref<ExportTask | null>(null)
const downloading = ref(false)
const error = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

const statusText = computed(() => {
  if (!task.value) return ''
  return t(`log.export.status.${task.value.status}`)
})

const fileInfo = computed(() => {
  if (!task.value || !task.value.rowCount) return ''
  const count = task.value.rowCount
  const size =
    task.value.fileSize == null ? '' : (task.value.fileSize / 1024 / 1024).toFixed(2) + ' MB'
  return t('log.export.fileInfo', { count, size })
})

const isPolling = computed(() => {
  return task.value?.status === 'PENDING' || task.value?.status === 'RUNNING'
})

const isSuccess = computed(() => task.value?.status === 'SUCCESS')
const isFailed = computed(() => task.value?.status === 'FAILED')

function startPolling() {
  stopPolling()
  fetchTask()
  pollTimer = setInterval(fetchTask, 5000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function fetchTask() {
  try {
    task.value = await getExportTask(props.taskId)
    if (!isPolling.value) {
      stopPolling()
    }
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : 'Unknown error'
    stopPolling()
  }
}

async function handleDownload() {
  downloading.value = true
  try {
    const blob = await downloadExportTask(props.taskId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = task.value?.fileName ?? `export_${props.taskId}.jsonl.gz`
    a.click()
    URL.revokeObjectURL(url)
    emit('downloaded')
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : 'Download failed'
  } finally {
    downloading.value = false
  }
}

function handleClose() {
  stopPolling()
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      error.value = ''
      startPolling()
    } else {
      stopPolling()
    }
  },
)

onUnmounted(() => stopPolling())
</script>
