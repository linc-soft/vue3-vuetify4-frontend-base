<template>
  <v-container>
    <!-- Search and action bar -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="3"
      >
        <v-select
          v-model="filters.employeeId"
          clearable
          density="compact"
          hide-details
          :items="employeeOptions"
          :label="t('leave.search.employee')"
          :loading="employeeLoading"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-select
          v-model="filters.leaveType"
          clearable
          density="compact"
          hide-details
          :items="leaveTypeOptions"
          :label="t('leave.search.leaveType')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-select
          v-model="filters.status"
          clearable
          density="compact"
          hide-details
          :items="statusOptions"
          :label="t('leave.search.status')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="auto"
      >
        <v-btn
          class="mr-2"
          color="primary"
          variant="elevated"
          @click="handleSearch"
        >
          {{ t('leave.search.search') }}
        </v-btn>
        <v-btn
          variant="outlined"
          @click="handleReset"
        >
          {{ t('leave.search.reset') }}
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
      <template #item.leaveType="{ value }">
        {{ leaveTypeLabelOf(value) }}
      </template>
      <template #item.startDate="{ item }">
        {{ item.startDate ? `${item.startDate} ${periodLabelOf(item.startPeriod ?? '')}` : '-' }}
      </template>
      <template #item.endDate="{ item }">
        {{ item.endDate ? `${item.endDate} ${periodLabelOf(item.endPeriod ?? '')}` : '-' }}
      </template>
      <template #item.status="{ value }">
        <v-chip
          :color="statusColorOf(value)"
          size="small"
          variant="tonal"
        >
          {{ statusLabelOf(value) }}
        </v-chip>
      </template>
      <template #item.createAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          density="compact"
          icon="mdi-eye-outline"
          size="small"
          :title="t('leave.actions.detail')"
          variant="text"
          @click="openDetail(item.id)"
        />
      </template>
    </v-data-table-server>

    <!-- Detail Dialog -->
    <LeaveDetailDialog
      v-model="detailDialog"
      :leave-id="selectedId"
    />
  </v-container>
</template>

<script lang="ts" setup>
import type { EmployeePageResponseItem } from '@/api/schemas/employee'
import type { LeavePageResponseItem } from '@/api/schemas/leave'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getEmployeePage } from '@/api/modules/employee'
import { getLeavePage } from '@/api/modules/leave'
import { useLeaveStatus } from '@/composables/useLeaveStatus'
import { useLeaveType } from '@/composables/useLeaveType'
import { usePeriodType } from '@/composables/usePeriodType'
import LeaveDetailDialog from './components/LeaveDetailDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: leaveTypeOptions, labelOf: leaveTypeLabelOf } = useLeaveType()
const { options: statusOptions, labelOf: statusLabelOf, colorOf: statusColorOf } = useLeaveStatus()
const { labelOf: periodLabelOf } = usePeriodType()

const filters = reactive<{
  employeeId: number | null
  leaveType: string
  status: string
}>({
  employeeId: null,
  leaveType: '',
  status: '',
})

const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([])

const items = ref<LeavePageResponseItem[]>([])
const loading = ref(false)

const detailDialog = ref(false)
const selectedId = ref<number | null>(null)

const employees = ref<EmployeePageResponseItem[]>([])
const employeeLoading = ref(false)

const sortFieldMap: Record<string, string> = {
  startDate: 'start_date',
  endDate: 'end_date',
  days: 'days',
  createAt: 'create_at',
}

const employeeOptions = computed(() =>
  employees.value.map(e => ({ title: e.realName, value: e.id })),
)

const headers = computed(() => [
  { title: t('leave.table.leaveType'), key: 'leaveType', sortable: false },
  { title: t('leave.table.startTime'), key: 'startDate' },
  { title: t('leave.table.endTime'), key: 'endDate' },
  { title: t('leave.table.days'), key: 'days' },
  { title: t('leave.table.status'), key: 'status', sortable: false },
  { title: t('leave.table.createAt'), key: 'createAt' },
  {
    title: t('leave.table.actions'),
    key: 'actions',
    sortable: false,
    cellClass: 'column-actions',
  },
])

onMounted(() => {
  fetchEmployees()
  fetchLeaves()
})

async function fetchEmployees() {
  employeeLoading.value = true
  try {
    const res = await getEmployeePage({
      page: 1,
      size: 1000,
    })
    employees.value = res.records
  } catch (error: unknown) {
    console.error('Failed to fetch employees:', error)
  } finally {
    employeeLoading.value = false
  }
}

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '-'
}

async function fetchLeaves() {
  loading.value = true
  try {
    const res = await getLeavePage({
      page: page.value,
      size: itemsPerPage.value,
      employeeId: filters.employeeId ?? undefined,
      leaveType: filters.leaveType || undefined,
      status: filters.status || undefined,
      sortBy:
        sortBy.value.length > 0
          ? sortBy.value.map(s => sortFieldMap[s.key] ?? s.key).join(',')
          : undefined,
      sortOrder: sortBy.value.length > 0 ? sortBy.value.map(s => s.order).join(',') : undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch leaves:', error)
  } finally {
    loading.value = false
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
  fetchLeaves()
}

function handleSearch() {
  page.value = 1
  fetchLeaves()
}

function handleReset() {
  filters.employeeId = null
  filters.leaveType = ''
  filters.status = ''
  sortBy.value = []
  handleSearch()
}

function openDetail(id: number) {
  selectedId.value = id
  detailDialog.value = true
}
</script>
