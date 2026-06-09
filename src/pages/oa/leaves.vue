<template>
  <v-container>
    <!-- Annual leave balance -->
    <AnnualBalanceCard
      ref="balanceCard"
      class="mb-4"
    />

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
          class="mr-2"
          variant="outlined"
          @click="handleReset"
        >
          {{ t('leave.search.reset') }}
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          variant="tonal"
          @click="submitDialog = true"
        >
          {{ t('leave.actions.submit') }}
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
        <v-btn
          v-if="item.status === '0'"
          color="warning"
          density="compact"
          icon="mdi-undo-variant"
          size="small"
          :title="t('leave.actions.withdraw')"
          variant="text"
          @click="openWithdrawConfirm(item)"
        />
      </template>
    </v-data-table-server>

    <!-- Submit Dialog -->
    <LeaveSubmitDialog
      v-model="submitDialog"
      @saved="onSubmitted"
    />

    <!-- Detail Dialog -->
    <LeaveDetailDialog
      v-model="detailDialog"
      :leave-id="selectedId"
    />

    <!-- Withdraw Confirmation Dialog -->
    <v-dialog
      v-model="withdrawDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('leave.withdraw.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('leave.withdraw.message') }}</p>
          <v-alert
            v-if="errorMessage"
            class="mt-3"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="withdrawLoading"
            variant="text"
            @click="withdrawDialog = false"
          >
            {{ t('leave.withdraw.cancel') }}
          </v-btn>
          <v-btn
            color="warning"
            :loading="withdrawLoading"
            variant="elevated"
            @click="handleWithdraw"
          >
            {{ t('leave.withdraw.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import type { LeavePageResponseItem } from '@/api/schemas/leave'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getLeavePage, withdrawLeave } from '@/api/modules/leave'
import { useLeaveStatus } from '@/composables/useLeaveStatus'
import { useLeaveType } from '@/composables/useLeaveType'
import { usePeriodType } from '@/composables/usePeriodType'
import AnnualBalanceCard from './components/AnnualBalanceCard.vue'
import LeaveDetailDialog from './components/LeaveDetailDialog.vue'
import LeaveSubmitDialog from './components/LeaveSubmitDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: leaveTypeOptions, labelOf: leaveTypeLabelOf } = useLeaveType()
const { options: statusOptions, labelOf: statusLabelOf, colorOf: statusColorOf } = useLeaveStatus()
const { labelOf: periodLabelOf } = usePeriodType()

const filters = reactive<{ leaveType: string; status: string }>({ leaveType: '', status: '' })

const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([])

const items = ref<LeavePageResponseItem[]>([])
const loading = ref(false)

const submitDialog = ref(false)
const detailDialog = ref(false)
const selectedId = ref<number | null>(null)

const withdrawDialog = ref(false)
const withdrawTarget = ref<{ id: number } | null>(null)
const withdrawLoading = ref(false)
const errorMessage = ref('')

const balanceCard = ref<InstanceType<typeof AnnualBalanceCard> | null>(null)

const sortFieldMap: Record<string, string> = {
  startDate: 'start_date',
  endDate: 'end_date',
  days: 'days',
  createAt: 'create_at',
}

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

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '-'
}

async function fetchLeaves() {
  loading.value = true
  try {
    const res = await getLeavePage({
      page: page.value,
      size: itemsPerPage.value,
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
  filters.leaveType = ''
  filters.status = ''
  sortBy.value = []
  handleSearch()
}

function openDetail(id: number) {
  selectedId.value = id
  detailDialog.value = true
}

function openWithdrawConfirm(item: LeavePageResponseItem) {
  errorMessage.value = ''
  withdrawTarget.value = { id: item.id }
  withdrawDialog.value = true
}

function onSubmitted() {
  handleSearch()
  balanceCard.value?.fetchBalance()
}

async function handleWithdraw() {
  if (!withdrawTarget.value) return
  withdrawLoading.value = true
  errorMessage.value = ''
  try {
    await withdrawLeave(withdrawTarget.value)
    withdrawDialog.value = false
    withdrawTarget.value = null
    fetchLeaves()
    balanceCard.value?.fetchBalance()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('leave.error.withdrawFailed')
  } finally {
    withdrawLoading.value = false
  }
}
</script>
