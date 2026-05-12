<template>
  <v-container fluid>
    <!-- Search and filter area -->
    <!-- Row 1: Username + Start Time + End Time -->
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
          :label="t('log.error.username')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        sm="4"
      >
        <v-text-field
          v-model="filters.startTime"
          density="compact"
          hide-details
          :label="t('log.error.startTime')"
          type="datetime-local"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
        sm="4"
      >
        <v-text-field
          v-model="filters.endTime"
          density="compact"
          hide-details
          :label="t('log.error.endTime')"
          type="datetime-local"
          variant="outlined"
        />
      </v-col>
    </v-row>
    <!-- Row 2: Trace ID + Error Type + Action Buttons -->
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
          v-model="filters.errorType"
          clearable
          density="compact"
          hide-details
          :label="t('log.error.errorType')"
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
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getErrorLogPage } from '@/api/modules/errorLog'
import { useSelectOptions } from '@/composables/useSelectOptions'

const { t } = useI18n()

// User select options
const { options: userOptions } = useSelectOptions('user')

// Filter Conditions
const filters = reactive({
  traceId: '',
  errorType: '',
  username: null,
  startTime: '',
  endTime: '',
})

// Pagination parameters
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Table data and loading state
const items = ref<ErrorLogPageItem[]>([])
const loading = ref(false)

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
      errorType: filters.errorType || undefined,
      username: filters.username || undefined,
      startTime: filters.startTime || undefined,
      endTime: filters.endTime || undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch error logs:', error)
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
  filters.errorType = ''
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
