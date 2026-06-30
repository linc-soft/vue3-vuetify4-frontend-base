<template>
  <v-dialog
    max-width="960"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('exportTask.title') }}</v-card-title>

      <v-card-text>
        <v-row
          align="center"
          class="mb-4"
          density="compact"
        >
          <v-col>
            <v-select
              v-model="typeFilter"
              density="compact"
              hide-details
              :items="typeOptions"
              :label="t('exportTask.typeLabel')"
              variant="outlined"
            />
          </v-col>
          <v-col cols="auto">
            <v-btn
              :aria-label="t('exportTask.refresh')"
              density="comfortable"
              icon="mdi-refresh"
              :loading="loading"
              size="small"
              variant="text"
              @click="fetchTasks"
            >
              <v-icon>mdi-refresh</v-icon>
              <v-tooltip
                activator="parent"
                location="bottom"
              >
                {{ t('exportTask.refresh') }}
              </v-tooltip>
            </v-btn>
          </v-col>
        </v-row>

        <v-data-table-server
          v-model="selectedTaskIds"
          v-model:items-per-page="itemsPerPage"
          v-model:page="page"
          :headers="headers"
          :item-selectable="isTaskSelectable"
          item-value="taskId"
          :items="items"
          :items-length="totalItems"
          :loading="loading"
          :mobile="mobile"
          multi-sort
          show-select
          @update:options="onOptionsUpdate"
        >
          <template #item.type="{ item }">
            {{ t(`exportTask.type.${item.type}`) }}
          </template>

          <template #item.createdAt="{ item }">
            {{ formatDateTime(item.createdAt) }}
          </template>

          <template #item.status="{ item }">
            <v-chip
              :color="statusColorOf(item.status)"
              size="small"
            >
              {{ t(`log.export.status.${item.status}`) }}
            </v-chip>
          </template>

          <template #item.expireAt="{ item }">
            {{ item.expireAt ? formatDateTime(item.expireAt) : '-' }}
          </template>

          <template #item.download="{ item }">
            <v-btn
              density="compact"
              :disabled="item.status !== 'SUCCESS'"
              icon="mdi-download"
              :loading="downloadingTaskId === item.taskId"
              size="small"
              variant="text"
              @click="handleDownload(item)"
            />
          </template>

          <template #item.preview="{ item }">
            <v-btn
              v-if="item.type === 'USER_REPORT'"
              density="compact"
              :disabled="item.status !== 'SUCCESS'"
              icon="mdi-eye-outline"
              :loading="previewingTaskId === item.taskId"
              size="small"
              variant="text"
              @click="handlePreview(item)"
            />
          </template>
        </v-data-table-server>

        <v-alert
          v-if="error"
          class="mt-4"
          :text="error"
          type="error"
          variant="tonal"
        />
      </v-card-text>

      <v-card-actions>
        <v-btn
          color="error"
          :disabled="selectedTaskIds.length === 0"
          :loading="clearing"
          variant="text"
          @click="confirmClearDialog = true"
        >
          {{ t('exportTask.clear') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="handleClose"
        >
          {{ t('log.export.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    v-model="confirmClearDialog"
    max-width="420"
  >
    <v-card>
      <v-card-title>{{ t('exportTask.clearConfirmTitle') }}</v-card-title>
      <v-card-text>
        {{ t('exportTask.clearConfirmMessage', { count: selectedTaskIds.length }) }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          :disabled="clearing"
          variant="text"
          @click="confirmClearDialog = false"
        >
          {{ t('exportTask.cancel') }}
        </v-btn>
        <v-btn
          color="error"
          :disabled="selectedTaskIds.length === 0"
          :loading="clearing"
          variant="elevated"
          @click="handleClear"
        >
          {{ t('exportTask.clear') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { ExportTaskPageResponseItem } from '@/api/schemas/exportTask'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteExportTasks, downloadExportTask, getExportTaskPage } from '@/api/modules/exportTask'
import { useSnackbarStore } from '@/stores/snackbar'

const { t } = useI18n()
const { mobile } = useDisplay()
const snackbar = useSnackbarStore()

const props = defineProps<{
  modelValue: boolean
  defaultType?: 'LOG_TRACE' | 'USER_REPORT'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const typeFilter = ref<'' | 'LOG_TRACE' | 'USER_REPORT'>(props.defaultType ?? '')
const items = ref<ExportTaskPageResponseItem[]>([])
const totalItems = ref(0)
const loading = ref(false)
const error = ref('')
const downloadingTaskId = ref('')
const previewingTaskId = ref('')
const clearing = ref(false)
const selectedTaskIds = ref<string[]>([])
const confirmClearDialog = ref(false)

const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'createdAt', order: 'desc' }])

let pollTimer: ReturnType<typeof setInterval> | null = null

const headers = computed(() => [
  { title: t('exportTask.typeLabel'), key: 'type', sortable: true },
  { title: t('exportTask.createdAt'), key: 'createdAt', sortable: true },
  { title: t('exportTask.status'), key: 'status', sortable: true },
  { title: t('exportTask.expireAt'), key: 'expireAt', sortable: true },
  { title: t('exportTask.download'), key: 'download', sortable: false, align: 'center' as const },
  { title: t('exportTask.preview'), key: 'preview', sortable: false, align: 'center' as const },
])

const typeOptions = computed(() => [
  { title: t('exportTask.allTypes'), value: '' },
  { title: t('exportTask.type.LOG_TRACE'), value: 'LOG_TRACE' },
  { title: t('exportTask.type.USER_REPORT'), value: 'USER_REPORT' },
])

const hasInProgressTask = computed(() =>
  items.value.some(item => item.status === 'PENDING' || item.status === 'RUNNING'),
)

function statusColorOf(status: string): string {
  switch (status) {
    case 'SUCCESS': {
      return 'success'
    }
    case 'FAILED': {
      return 'error'
    }
    case 'PENDING':
    case 'RUNNING': {
      return 'primary'
    }
    case 'EXPIRED': {
      return 'warning'
    }
    default: {
      return 'default'
    }
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}

function mapSortKey(key: string): string {
  switch (key) {
    case 'createdAt': {
      return 'created_at'
    }
    case 'expireAt': {
      return 'expire_at'
    }
    default: {
      return key
    }
  }
}

function isTaskSelectable(item: ExportTaskPageResponseItem): boolean {
  return item.status !== 'PENDING' && item.status !== 'RUNNING'
}

function onOptionsUpdate(options: {
  page: number
  itemsPerPage: number
  sortBy: { key: string; order: 'asc' | 'desc' }[]
}) {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy ?? []
  fetchTasks()
}

async function fetchTasks() {
  loading.value = true
  error.value = ''
  try {
    const res = await getExportTaskPage({
      page: page.value,
      size: itemsPerPage.value,
      type: typeFilter.value || undefined,
      sortBy:
        sortBy.value.length > 0 ? sortBy.value.map(s => mapSortKey(s.key)).join(',') : 'created_at',
      sortOrder: sortBy.value.length > 0 ? sortBy.value.map(s => s.order).join(',') : 'desc',
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : t('exportTask.loadFailed')
  } finally {
    loading.value = false
  }
}

function startPolling() {
  stopPolling()
  if (!hasInProgressTask.value) return
  pollTimer = setInterval(fetchTasks, 5000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function handleDownload(item: ExportTaskPageResponseItem) {
  downloadingTaskId.value = item.taskId
  try {
    const blob = await downloadExportTask(item.taskId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.fileName ?? `export_${item.taskId}`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : t('exportTask.downloadFailed')
  } finally {
    downloadingTaskId.value = ''
  }
}

async function handlePreview(item: ExportTaskPageResponseItem) {
  if (item.type !== 'USER_REPORT') return
  previewingTaskId.value = item.taskId
  try {
    const blob = await downloadExportTask(item.taskId)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : t('exportTask.previewFailed')
  } finally {
    previewingTaskId.value = ''
  }
}

async function handleClear() {
  if (selectedTaskIds.value.length === 0) return
  const count = selectedTaskIds.value.length
  clearing.value = true
  error.value = ''
  try {
    await deleteExportTasks(selectedTaskIds.value)
    selectedTaskIds.value = []
    confirmClearDialog.value = false
    snackbar.success(t('exportTask.clearSuccess', { count }))
    await fetchTasks()
  } catch (error_: unknown) {
    error.value = error_ instanceof Error ? error_.message : t('exportTask.clearFailed')
  } finally {
    clearing.value = false
  }
}

function handleClose() {
  stopPolling()
  confirmClearDialog.value = false
  emit('update:modelValue', false)
}

watch(typeFilter, () => {
  page.value = 1
  selectedTaskIds.value = []
  confirmClearDialog.value = false
  fetchTasks()
})

watch(
  () => props.modelValue,
  async val => {
    if (val) {
      typeFilter.value = props.defaultType ?? ''
      page.value = 1
      selectedTaskIds.value = []
      confirmClearDialog.value = false
      await fetchTasks()
      startPolling()
    } else {
      stopPolling()
      confirmClearDialog.value = false
    }
  },
)

watch(items, () => {
  stopPolling()
  startPolling()
})

onUnmounted(() => stopPolling())
</script>
