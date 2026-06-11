<template>
  <v-container fluid>
    <!-- Search and filter area -->
    <!-- Row 1: SQL Type + Mapper Class + Mapper Method -->
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
          v-model="filters.sqlType"
          clearable
          density="compact"
          hide-details
          :items="sqlTypeOptions"
          :label="t('log.sql.sqlType')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        sm="8"
      >
        <v-text-field
          v-model="filters.mapperClass"
          clearable
          density="compact"
          hide-details
          :label="t('log.sql.mapperClass')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        sm="8"
      >
        <v-text-field
          v-model="filters.mapperMethod"
          clearable
          density="compact"
          hide-details
          :label="t('log.sql.mapperMethod')"
          variant="outlined"
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
        <v-autocomplete
          v-model="filters.username"
          clearable
          density="compact"
          hide-details
          item-value="label"
          :items="userOptions"
          :label="t('log.sql.username')"
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
          :label="t('log.sql.timeRange')"
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
          clearable
          density="compact"
          hide-details
          :label="t('log.sql.traceId')"
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
          v-if="value"
          class="text-primary text-decoration-none"
          :href="`/logs/trace/${value}`"
          target="_blank"
        >
          {{ truncateTraceId(value) }}
        </a>
        <span v-else>-</span>
      </template>
      <template #item.sqlType="{ value }">
        <v-chip
          v-if="value"
          :color="getSqlTypeColor(value)"
          size="small"
        >
          {{ value }}
        </v-chip>
        <span v-else>-</span>
      </template>
      <template #item.duration="{ value }">
        <span :class="{ 'text-warning': value && value > 1000 }">
          {{ value != null ? `${value}ms` : '-' }}
        </span>
      </template>
      <template #item.isSlow="{ value }">
        <v-chip
          v-if="value"
          color="error"
          size="small"
        >
          {{ t('log.sql.isSlow') }}
        </v-chip>
        <span v-else>-</span>
      </template>
      <template #item.createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script lang="ts" setup>
import type { SqlLogPageItem } from '@/api/schemas/sqlLog'
import type { DatetimeRange } from '@/components/DatetimeRangePicker.vue'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getSqlLogPage } from '@/api/modules/sqlLog'
import DatetimeRangePicker from '@/components/DatetimeRangePicker.vue'
import { useSelectOptions } from '@/composables/useSelectOptions'

const { t } = useI18n()
const { mobile } = useDisplay()

// User select options
const { options: userOptions } = useSelectOptions('user')

// Filter Conditions
const filters = reactive({
  traceId: '',
  username: null as string | null,
  sqlType: null as 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | null,
  mapperClass: '',
  mapperMethod: '',
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
const items = ref<SqlLogPageItem[]>([])
const loading = ref(false)

// SQL type options
const sqlTypeOptions = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

// Sort field mapping (frontend key → backend entity field name)
const sortFieldMap: Record<string, string> = {
  createdAt: 'createTime',
  sqlType: 'sql_type',
  mapperMethod: 'mapper_method',
}

// Table column definitions
const allHeaders = computed(() => [
  { title: t('log.sql.traceId'), key: 'traceId' },
  { title: t('log.sql.sqlType'), key: 'sqlType' },
  { title: t('log.sql.mapperMethod'), key: 'mapperMethod' },
  { title: t('log.sql.duration'), key: 'duration' },
  { title: t('log.sql.username'), key: 'username' },
  { title: t('log.sql.isSlow'), key: 'isSlow' },
  { title: t('log.common.createdAt'), key: 'createdAt' },
])

// Fetch paginated data
async function fetchLogs() {
  loading.value = true
  try {
    const res = await getSqlLogPage({
      page: page.value,
      size: itemsPerPage.value,
      traceId: filters.traceId || undefined,
      username: filters.username || undefined,
      sqlType: filters.sqlType ?? undefined,
      mapperClass: filters.mapperClass || undefined,
      mapperMethod: filters.mapperMethod || undefined,
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
    console.error('Failed to fetch SQL logs:', error)
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
  filters.sqlType = null
  filters.mapperClass = ''
  filters.mapperMethod = ''
  timeRange.value = null
  sortBy.value = []
  handleSearch()
}

// Truncate trace ID
function truncateTraceId(traceId: string): string {
  if (traceId.length <= 16) return traceId
  return `${traceId.slice(0, 8)}...${traceId.slice(-4)}`
}

// Get SQL type color
function getSqlTypeColor(sqlType: string): string {
  switch (sqlType) {
    case 'SELECT': {
      return 'info'
    }
    case 'INSERT': {
      return 'success'
    }
    case 'UPDATE': {
      return 'warning'
    }
    case 'DELETE': {
      return 'error'
    }
    default: {
      return 'default'
    }
  }
}

// Format date time
function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString()
}
</script>
