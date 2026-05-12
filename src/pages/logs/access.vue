<template>
  <v-container fluid>
    <!-- Search and filter area -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="2"
      >
        <v-text-field
          v-model="filters.traceId"
          clearable
          density="compact"
          hide-details
          :label="t('log.access.traceId')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
      >
        <v-autocomplete
          v-model="filters.username"
          clearable
          density="compact"
          hide-details
          item-value="label"
          :items="userOptions"
          :label="t('log.access.username')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="1"
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
        md="2"
      >
        <v-text-field
          v-model="filters.path"
          clearable
          density="compact"
          hide-details
          :label="t('log.access.path')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="1"
      >
        <v-select
          v-model="filters.statusCode"
          clearable
          density="compact"
          hide-details
          :items="statusCodeOptions"
          :label="t('log.access.statusCode')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
      >
        <v-text-field
          v-model="filters.startTime"
          density="compact"
          hide-details
          :label="t('log.access.startTime')"
          type="datetime-local"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
      >
        <v-text-field
          v-model="filters.endTime"
          density="compact"
          hide-details
          :label="t('log.access.endTime')"
          type="datetime-local"
          variant="outlined"
        />
      </v-col>
    </v-row>
    <v-row
      align="center"
      density="compact"
    >
      <v-col cols="auto">
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleSearch"
        >
          {{ t('log.common.search') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn
          variant="outlined"
          @click="handleReset"
        >
          {{ t('log.common.reset') }}
        </v-btn>
      </v-col>
      <v-col cols="auto">
        <v-btn
          :loading="exportLoading"
          prepend-icon="mdi-download"
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
      :headers="visibleHeaders"
      :items="items"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :page="page"
      @update:options="onOptionsUpdate"
    >
      <template #item.traceId="{ value }">
        <router-link
          class="text-primary text-decoration-none"
          :to="`/logs/trace/${value}`"
        >
          {{ truncateTraceId(value) }}
        </router-link>
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
  </v-container>
</template>

<script lang="ts" setup>
import type { AccessLogPageItem } from '@/api/schemas/accessLog'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { exportAccessLogs, getAccessLogPage } from '@/api/modules/accessLog'
import { useSelectOptions } from '@/composables/useSelectOptions'

const { t } = useI18n()
const { smAndDown } = useDisplay()

// User select options
const { options: userOptions } = useSelectOptions('user')

// Filter Conditions
const filters = reactive({
  traceId: '',
  username: null,
  method: null,
  path: '',
  statusCode: null as number | null,
  startTime: '',
  endTime: '',
})

// Pagination parameters
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Table data and loading state
const items = ref<AccessLogPageItem[]>([])
const loading = ref(false)
const exportLoading = ref(false)

// Method options
const methodOptions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

// Status code options
const statusCodeOptions = [
  { title: '2xx', value: 200 },
  { title: '4xx', value: 400 },
  { title: '5xx', value: 500 },
]

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

const visibleHeaders = computed(() => {
  if (smAndDown.value) {
    return allHeaders.value.filter(h => h.key !== 'clientIp')
  }
  return allHeaders.value
})

// Fetch paginated data
async function fetchLogs() {
  loading.value = true
  try {
    const res = await getAccessLogPage({
      page: page.value,
      size: itemsPerPage.value,
      traceId: filters.traceId || undefined,
      username: filters.username || undefined,
      method: filters.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | undefined,
      path: filters.path || undefined,
      statusCode: filters.statusCode || undefined,
      startTime: filters.startTime || undefined,
      endTime: filters.endTime || undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch access logs:', error)
  } finally {
    loading.value = false
  }
}

// Handle pagination option changes
function onOptionsUpdate(options: { page: number; itemsPerPage: number }) {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
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
  filters.startTime = ''
  filters.endTime = ''
  handleSearch()
}

// Export
async function handleExport() {
  exportLoading.value = true
  try {
    const blob = await exportAccessLogs({
      traceId: filters.traceId || undefined,
      username: filters.username || undefined,
      method: filters.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | undefined,
      path: filters.path || undefined,
      statusCode: filters.statusCode || undefined,
      startTime: filters.startTime || undefined,
      endTime: filters.endTime || undefined,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `access_logs_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error: unknown) {
    console.error('Failed to export access logs:', error)
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
