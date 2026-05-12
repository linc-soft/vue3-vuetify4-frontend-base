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
          :label="t('log.operation.traceId')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="1"
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
      <v-col
        cols="12"
        md="2"
      >
        <v-select
          v-model="filters.targetType"
          clearable
          density="compact"
          hide-details
          :items="targetTypeOptions"
          :label="t('log.operation.targetType')"
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
          :label="t('log.operation.username')"
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
          :label="t('log.operation.startTime')"
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
          :label="t('log.operation.endTime')"
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
        <router-link
          class="text-primary text-decoration-none"
          :to="`/logs/trace/${value}`"
        >
          {{ truncateTraceId(value) }}
        </router-link>
      </template>
      <template #item.operationType="{ value }">
        <v-chip
          :color="getOperationTypeColor(value)"
          size="small"
        >
          {{ t(`log.operation.types.${value}`) }}
        </v-chip>
      </template>
      <template #item.createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script lang="ts" setup>
import type { OperationLogPageItem, OperationType } from '@/api/schemas/operationLog'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getOperationLogPage, getOperationTargetTypes } from '@/api/modules/operationLog'
import { useSelectOptions } from '@/composables/useSelectOptions'

const { t } = useI18n()

// User select options
const { options: userOptions } = useSelectOptions('user')

// Filter Conditions
const filters = reactive({
  traceId: '',
  operationType: null as OperationType | null,
  targetType: null,
  username: null,
  startTime: '',
  endTime: '',
})

// Pagination parameters
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Table data and loading state
const items = ref<OperationLogPageItem[]>([])
const loading = ref(false)

// Target type options (loaded from backend)
const targetTypeOptions = ref<string[]>([])

// Operation type options
const operationTypeOptions = computed(() => [
  { title: t('log.operation.types.CREATE'), value: 'CREATE' },
  { title: t('log.operation.types.UPDATE'), value: 'UPDATE' },
  { title: t('log.operation.types.DELETE'), value: 'DELETE' },
])

// Table column definitions
const headers = computed(() => [
  { title: t('log.operation.traceId'), key: 'traceId' },
  { title: t('log.operation.operationType'), key: 'operationType' },
  { title: t('log.operation.targetType'), key: 'targetType' },
  { title: t('log.operation.targetId'), key: 'targetId' },
  { title: t('log.operation.summary'), key: 'summary' },
  { title: t('log.operation.username'), key: 'username' },
  { title: t('log.common.createdAt'), key: 'createdAt' },
])

// Load target types on mount
onMounted(async () => {
  try {
    targetTypeOptions.value = await getOperationTargetTypes()
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
      targetType: filters.targetType || undefined,
      username: filters.username || undefined,
      startTime: filters.startTime || undefined,
      endTime: filters.endTime || undefined,
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
  filters.targetType = null
  filters.username = null
  filters.startTime = ''
  filters.endTime = ''
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
