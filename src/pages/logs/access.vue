<template>
  <v-container fluid>
    <!-- Search and filter area -->
    <!-- Row 1: Request Method + API Path + Status Code -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="2"
        sm="4"
      >
        <v-select
          v-model="filters.method"
          clearable
          density="compact"
          hide-details
          :items="methodOptions"
          :label="t('log.access.method')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        sm="8"
      >
        <v-text-field
          v-model="filters.path"
          autocomplete="off"
          clearable
          density="compact"
          hide-details
          :label="t('log.access.path')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
        sm="4"
      >
        <EnumSelect
          v-model="filters.statusCode"
          clearable
          display-field="code"
          hide-details
          :label="t('log.access.statusCode')"
          show-subtitle
          type="result-code"
        />
      </v-col>
    </v-row>
    <!-- Row 2: Username + Time Range -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="2"
        sm="4"
      >
        <OptionSelect
          v-model="filters.username"
          clearable
          hide-details
          :label="t('log.access.username')"
          type="username"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        sm="8"
      >
        <DatetimeRangePicker
          v-model="timeRange"
          :label="t('log.access.timeRange')"
        />
      </v-col>
    </v-row>
    <!-- Row 3: Trace ID + Action Buttons -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="4"
        sm="6"
      >
        <v-text-field
          v-model="filters.traceId"
          autocomplete="off"
          clearable
          density="compact"
          hide-details
          :label="t('log.access.traceId')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="auto"
        sm="6"
      >
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleSearch"
        >
          {{ t('log.common.search') }}
        </v-btn>
        <v-btn
          class="ml-2"
          variant="outlined"
          @click="handleReset"
        >
          {{ t('log.common.reset') }}
        </v-btn>
        <v-btn
          v-perm="'log:access:export'"
          class="ml-2"
          :loading="exportLoading"
          :prepend-icon="iconOf('log:access:export', 'mdi-download')"
          variant="tonal"
          @click="handleExport"
        >
          {{ t('log.common.export') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Paginated data table -->
    <v-data-table-server
      class="mt-4"
      :headers="allHeaders"
      :items="items"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :mobile="mobile"
      :page="page"
      :sort-by="sortBy"
      @update:options="onOptionsUpdate"
    >
      <template #item.traceId="{ value }">
        <a
          class="text-primary text-decoration-none"
          :href="`/logs/trace/${value}`"
          target="_blank"
        >
          {{ truncateTraceId(value) }}
        </a>
        <CopyButton
          class="ml-1"
          :text="value"
        />
      </template>
      <template #item.statusCode="{ value }">
        <v-chip
          :color="getStatusCodeColor(value)"
          size="small"
        >
          {{ value }}
        </v-chip>
      </template>
      <template #item.duration="{ value }">
        <span :class="{ 'text-warning': value > 1000 }"> {{ value }}ms </span>
      </template>
      <template #item.createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
    </v-data-table-server>

    <ExportTaskDialog
      v-model="exportDialog"
      :task-id="exportTaskId"
    />
  </v-container>
</template>

<script lang="ts" setup>
import type { AccessLogPageItem } from '@/api/schemas/accessLog'
import type { DatetimeRange } from '@/components/DatetimeRangePicker.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getAccessLogPage } from '@/api/modules/accessLog'
import { createExportTask } from '@/api/modules/exportTask'
import CopyButton from '@/components/CopyButton.vue'
import DatetimeRangePicker from '@/components/DatetimeRangePicker.vue'
import EnumSelect from '@/components/EnumSelect.vue'
import ExportTaskDialog from '@/components/ExportTaskDialog.vue'
import OptionSelect from '@/components/OptionSelect.vue'
import { useResourceIcon } from '@/composables/useResourceIcon'

const { t } = useI18n()
const { mobile } = useDisplay()
const { iconOf } = useResourceIcon()

// Status code group options (loaded from backend enums)

// Filter Conditions
const filters = reactive({
  traceId: '',
  username: null as string | null,
  method: null as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | null,
  path: '',
  statusCode: null as string | null,
})

// Time range for datetime picker
const timeRange = ref<DatetimeRange | null>(null)

// Pagination parameters
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Sorting parameters
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([])

// Table data and loading state
const items = ref<AccessLogPageItem[]>([])
const loading = ref(false)
const exportLoading = ref(false)
const exportDialog = ref(false)
const exportTaskId = ref('')

// Method options
const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

// Sort field mapping (frontend key → backend entity field name)
const sortFieldMap: Record<string, string> = {
  method: 'requestMethod',
  path: 'requestUrl',
  statusCode: 'responseStatus',
  createdAt: 'createTime',
}

// Table column definitions
const allHeaders = computed(() => [
  { title: t('log.access.traceId'), key: 'traceId' },
  { title: t('log.access.username'), key: 'username' },
  { title: t('log.access.method'), key: 'method' },
  { title: t('log.access.path'), key: 'path' },
  { title: t('log.access.statusCode'), key: 'statusCode' },
  { title: t('log.access.duration'), key: 'duration' },
  { title: t('log.access.clientIp'), key: 'clientIp' },
  { title: t('log.common.createdAt'), key: 'createdAt' },
])

// Fetch paginated data
async function fetchLogs() {
  loading.value = true
  try {
    const res = await getAccessLogPage({
      page: page.value,
      size: itemsPerPage.value,
      traceId: filters.traceId || undefined,
      username: filters.username || undefined,
      method: filters.method ?? undefined,
      path: filters.path || undefined,
      statusCode: filters.statusCode ?? undefined,
      startTime: timeRange.value?.startTime || undefined,
      endTime: timeRange.value?.endTime || undefined,
      sortBy:
        sortBy.value.length > 0
          ? sortBy.value.map(s => sortFieldMap[s.key] ?? s.key).join(',')
          : undefined,
      sortOrder: sortBy.value.length > 0 ? sortBy.value.map(s => s.order).join(',') : undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch access logs:', error)
  } finally {
    loading.value = false
  }
}

// Handle pagination and sorting option changes
function onOptionsUpdate(options: {
  page: number
  itemsPerPage: number
  sortBy: { key: string; order: 'asc' | 'desc' }[]
}) {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy ?? []
  fetchLogs()
}

// Search
function handleSearch() {
  page.value = 1
  fetchLogs()
}

// Reset
function handleReset() {
  filters.traceId = ''
  filters.username = null
  filters.method = null
  filters.path = ''
  filters.statusCode = null
  timeRange.value = null
  sortBy.value = []
  handleSearch()
}

// Export
async function handleExport() {
  exportLoading.value = true
  try {
    const { taskId } = await createExportTask({
      traceId: filters.traceId || undefined,
      username: filters.username || undefined,
      method: filters.method ?? undefined,
      path: filters.path || undefined,
      statusCode: filters.statusCode ?? undefined,
      startTime: timeRange.value?.startTime || undefined,
      endTime: timeRange.value?.endTime || undefined,
    })
    exportTaskId.value = taskId
    exportDialog.value = true
  } catch (error: unknown) {
    console.error('Failed to create export task:', error)
  } finally {
    exportLoading.value = false
  }
}

// Truncate trace ID
function truncateTraceId(traceId: string): string {
  if (traceId.length <= 16) return traceId
  return `${traceId.slice(0, 8)}...${traceId.slice(-4)}`
}

// Get status code color
function getStatusCodeColor(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return 'success'
  if (statusCode >= 400 && statusCode < 500) return 'warning'
  if (statusCode >= 500) return 'error'
  return 'default'
}

// Format date time
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}
</script>
