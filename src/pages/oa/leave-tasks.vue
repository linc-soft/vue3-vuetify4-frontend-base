<template>
  <v-container>
    <!-- Action bar -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col cols="12">
        <v-btn
          variant="outlined"
          @click="fetchTasks"
        >
          {{ t('leave.tasks.refresh') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Pending tasks table -->
    <v-data-table
      class="mt-4"
      :headers="headers"
      :items="items"
      :loading="loading"
      :mobile="mobile"
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
      <template #item.createAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          density="comfortable"
          prepend-icon="mdi-gavel"
          size="small"
          variant="tonal"
          @click="openReview(item)"
        >
          {{ t('leave.tasks.review') }}
        </v-btn>
      </template>
    </v-data-table>

    <!-- Review Dialog -->
    <LeaveReviewDialog
      v-model="reviewDialog"
      :task="selectedTask"
      @reviewed="fetchTasks"
    />
  </v-container>
</template>

<script lang="ts" setup>
import type { LeaveTaskResponseItem } from '@/api/schemas/leave'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getMyPendingTasks } from '@/api/modules/leave'
import { useLeaveType } from '@/composables/useLeaveType'
import { usePeriodType } from '@/composables/usePeriodType'
import LeaveReviewDialog from './components/LeaveReviewDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { labelOf: leaveTypeLabelOf } = useLeaveType()
const { labelOf: periodLabelOf } = usePeriodType()

const items = ref<LeaveTaskResponseItem[]>([])
const loading = ref(false)

const reviewDialog = ref(false)
const selectedTask = ref<LeaveTaskResponseItem | null>(null)

const headers = computed(() => [
  { title: t('leave.table.leaveType'), key: 'leaveType' },
  { title: t('leave.table.startTime'), key: 'startDate' },
  { title: t('leave.table.endTime'), key: 'endDate' },
  { title: t('leave.table.days'), key: 'days' },
  { title: t('leave.submit.reason'), key: 'reason' },
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

async function fetchTasks() {
  loading.value = true
  try {
    items.value = await getMyPendingTasks()
  } catch (error: unknown) {
    console.error('Failed to fetch leave tasks:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTasks()
})

function openReview(task: LeaveTaskResponseItem) {
  selectedTask.value = task
  reviewDialog.value = true
}
</script>
