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
        <v-select
          v-model="typeFilter"
          class="mb-4"
          density="compact"
          hide-details
          :items="typeOptions"
          :label="t('exportTask.typeLabel')"
          variant="outlined"
        />

        <v-data-table-server
          v-model:items-per-page="itemsPerPage"
          v-model:page="page"
          :headers="headers"
          :items="items"
          :items-length="totalItems"
          :loading="loading"
          :mobile="mobile"
          multi-sort
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
</template>

<script lang="ts" setup>
import type { ExportTaskPageResponseItem } from '@/api/schemas/exportTask'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { downloadExportTask, getExportTaskPage } from '@/api/modules/exportTask'

const { t } = useI18n()
const { mobile } = useDisplay()

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

function handlePreview(item: ExportTaskPageResponseItem) {
  if (item.type !== 'USER_REPORT') return
  window.open(`/api/tasks/${item.taskId}/download`, '_blank')
}

function handleClose() {
  stopPolling()
  emit('update:modelValue', false)
}

watch(typeFilter, () => {
  page.value = 1
  fetchTasks()
})

watch(
  () => props.modelValue,
  async val => {
    if (val) {
      typeFilter.value = props.defaultType ?? ''
      page.value = 1
      await fetchTasks()
      startPolling()
    } else {
      stopPolling()
    }
  },
)

watch(items, () => {
  stopPolling()
  startPolling()
})

onUnmounted(() => stopPolling())
</script>
