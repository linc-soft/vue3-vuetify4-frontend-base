<template>
  <v-container fluid>
    <!-- Search and filter area -->
    <!-- Row 1: Module + Operation Type -->
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
          v-model="filters.module"
          clearable
          density="compact"
          hide-details
          :items="moduleOptions"
          :label="t('log.operation.module')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
        sm="4"
      >
        <v-select
          v-model="filters.operationType"
          clearable
          density="compact"
          hide-details
          :items="operationTypeOptions"
          :label="t('log.operation.operationType')"
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
          :label="t('log.operation.username')"
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
          :label="t('log.operation.timeRange')"
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
          :label="t('log.operation.traceId')"
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
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :page="page"
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
      <template #item.operationType="{ value }">
        <v-chip
          v-if="value"
          :color="getOperationTypeColor(value)"
          size="small"
        >
          {{ t(`log.operation.types.${value}`) }}
        </v-chip>
        <span v-else>-</span>
      </template>
      <template #item.module="{ value }">
        <span>{{ value || '-' }}</span>
      </template>
      <template #item.subModule="{ value }">
        <span>{{ value || '-' }}</span>
      </template>
      <template #item.description="{ value }">
        <span>{{ value || '-' }}</span>
      </template>
      <template #item.duration="{ value }">
        <span v-if="value !== null && value !== undefined">{{ value }}ms</span>
        <span v-else>-</span>
      </template>
      <template #item.username="{ value }">
        <span>{{ value || '-' }}</span>
      </template>
      <template #item.createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script lang="ts" setup>
import type { OperationLogPageItem, OperationType } from '@/api/schemas/operationLog'
import type { DatetimeRange } from '@/components/DatetimeRangePicker.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getOperationLogPage, getOperationModules } from '@/api/modules/operationLog'
import DatetimeRangePicker from '@/components/DatetimeRangePicker.vue'
import { useSelectOptions } from '@/composables/useSelectOptions'

const { t } = useI18n()

// User select options
const { options: userOptions } = useSelectOptions('user')

// Filter Conditions
const filters = reactive({
  traceId: '',
  operationType: null as OperationType | null,
  module: null as string | null,
  username: null as string | null,
})

// Time range for datetime picker
const timeRange = ref<DatetimeRange | null>(null)

// Pagination parameters
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Table data and loading state
const items = ref<OperationLogPageItem[]>([])
const loading = ref(false)

// Module options (loaded from backend)
const moduleOptions = ref<string[]>([])

// Operation type options
const operationTypeOptions = computed(() => [
  { title: t('log.operation.types.CREATE'), value: 'CREATE' },
  { title: t('log.operation.types.UPDATE'), value: 'UPDATE' },
  { title: t('log.operation.types.DELETE'), value: 'DELETE' },
  { title: t('log.operation.types.OTHER'), value: 'OTHER' },
])

// Table column definitions
const headers = computed(() => [
  { title: t('log.operation.traceId'), key: 'traceId' },
  { title: t('log.operation.operationType'), key: 'operationType' },
  { title: t('log.operation.module'), key: 'module' },
  { title: t('log.operation.subModule'), key: 'subModule' },
  { title: t('log.operation.description'), key: 'description' },
  { title: t('log.operation.duration'), key: 'duration' },
  { title: t('log.operation.username'), key: 'username' },
  { title: t('log.common.createdAt'), key: 'createdAt' },
])

// Load modules on mount
onMounted(async () => {
  try {
    moduleOptions.value = await getOperationModules()
  } catch {
    // Silently fail
  }
})

// Fetch paginated data
async function fetchLogs() {
  loading.value = true
  try {
    const res = await getOperationLogPage({
      page: page.value,
      size: itemsPerPage.value,
      traceId: filters.traceId || undefined,
      operationType: filters.operationType || undefined,
      module: filters.module || undefined,
      username: filters.username || undefined,
      startTime: timeRange.value?.startTime || undefined,
      endTime: timeRange.value?.endTime || undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch operation logs:', error)
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
  filters.operationType = null
  filters.module = null
  filters.username = null
  timeRange.value = null
  handleSearch()
}

// Truncate trace ID
function truncateTraceId(traceId: string): string {
  if (traceId.length <= 16) return traceId
  return `${traceId.slice(0, 8)}...${traceId.slice(-4)}`
}

// Get operation type color
function getOperationTypeColor(type: OperationType): string {
  switch (type) {
    case 'CREATE': {
      return 'success'
    }
    case 'UPDATE': {
      return 'primary'
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
