<template>
  <v-container fluid>
    <!-- Search and filter area -->
    <!-- Row 1: Username + Time Range -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="2"
        sm="4"
      >
        <v-autocomplete
          v-model="filters.username"
          clearable
          density="compact"
          hide-details
          :items="userOptions"
          :label="t('log.error.username')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        sm="8"
      >
        <DatetimeRangePicker
          v-model="timeRange"
          :label="t('log.error.timeRange')"
        />
      </v-col>
    </v-row>
    <!-- Row 2: Trace ID + Keyword + Action Buttons -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="2"
        sm="4"
      >
        <v-text-field
          v-model="filters.traceId"
          clearable
          density="compact"
          hide-details
          :label="t('log.error.traceId')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
        sm="4"
      >
        <v-text-field
          v-model="filters.keyword"
          clearable
          density="compact"
          hide-details
          :label="t('log.error.keyword')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="auto"
        sm="4"
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
      </v-col>
    </v-row>

    <!-- Paginated data table -->
    <v-data-table-server
      class="mt-4"
      :headers="headers"
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
      </template>
      <template #item.message="{ value }">
        <span :title="value">{{ truncateMessage(value) }}</span>
      </template>
      <template #item.createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script lang="ts" setup>
import type { ErrorLogPageItem } from '@/api/schemas/errorLog'
import type { DatetimeRange } from '@/components/DatetimeRangePicker.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getErrorLogPage } from '@/api/modules/errorLog'
import DatetimeRangePicker from '@/components/DatetimeRangePicker.vue'
import { useSelectOptions } from '@/composables/useSelectOptions'

const { t } = useI18n()
const { mobile } = useDisplay()

// User select options
const { options: userOptions } = useSelectOptions('user')

// Filter Conditions
const filters = reactive({
  traceId: '',
  keyword: '',
  username: null as string | null,
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
const items = ref<ErrorLogPageItem[]>([])
const loading = ref(false)

// Sort field mapping (frontend key → backend entity field name)
const sortFieldMap: Record<string, string> = {
  errorType: 'exceptionClass',
  message: 'exceptionMessage',
  createdAt: 'createTime',
}

// Table column definitions
const headers = computed(() => [
  { title: t('log.error.traceId'), key: 'traceId' },
  { title: t('log.error.errorType'), key: 'errorType' },
  { title: t('log.error.message'), key: 'message' },
  { title: t('log.error.username'), key: 'username' },
  { title: t('log.common.createdAt'), key: 'createdAt' },
])

// Fetch paginated data
async function fetchLogs() {
  loading.value = true
  try {
    const res = await getErrorLogPage({
      page: page.value,
      size: itemsPerPage.value,
      traceId: filters.traceId || undefined,
      keyword: filters.keyword || undefined,
      username: filters.username || undefined,
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
    console.error('Failed to fetch error logs:', error)
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
  filters.keyword = ''
  filters.username = null
  timeRange.value = null
  sortBy.value = []
  handleSearch()
}

// Truncate trace ID
function truncateTraceId(traceId: string): string {
  if (traceId.length <= 16) return traceId
  return `${traceId.slice(0, 8)}...${traceId.slice(-4)}`
}

// Truncate message
function truncateMessage(message: string): string {
  if (message.length <= 50) return message
  return `${message.slice(0, 50)}...`
}

// Format date time
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}
</script>
