<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('leave.detail.title') }}</v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <template v-else-if="leave">
          <v-list>
            <v-list-item :title="t('leave.table.leaveType')">
              <template #subtitle>{{ leaveTypeLabelOf(leave.leaveType) }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.table.status')">
              <template #subtitle>
                <v-chip
                  :color="statusColorOf(leave.status)"
                  size="small"
                  variant="tonal"
                >
                  {{ statusLabelOf(leave.status) }}
                </v-chip>
              </template>
            </v-list-item>
            <v-list-item :title="t('leave.table.startTime')">
              <template #subtitle>{{
                leave.startDate
                  ? `${leave.startDate} ${periodLabelOf(leave.startPeriod ?? '')}`
                  : '-'
              }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.table.endTime')">
              <template #subtitle>{{
                leave.endDate ? `${leave.endDate} ${periodLabelOf(leave.endPeriod ?? '')}` : '-'
              }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.table.days')">
              <template #subtitle>{{ leave.days ?? '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.submit.reason')">
              <template #subtitle>{{ leave.reason || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.detail.approvalComment')">
              <template #subtitle>{{ leave.approvalComment || '-' }}</template>
            </v-list-item>
          </v-list>
        </template>
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
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('leave.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { LeaveInfoResponse } from '@/api/schemas/leave'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getLeave } from '@/api/modules/leave'
import { useLeaveStatus } from '@/composables/useLeaveStatus'
import { useLeaveType } from '@/composables/useLeaveType'
import { usePeriodType } from '@/composables/usePeriodType'

const props = defineProps<{
  modelValue: boolean
  leaveId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { labelOf: leaveTypeLabelOf } = useLeaveType()
const { labelOf: statusLabelOf, colorOf: statusColorOf } = useLeaveStatus()
const { labelOf: periodLabelOf } = usePeriodType()

const leave = ref<LeaveInfoResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')

watch(
  () => props.modelValue,
  async open => {
    if (!open || props.leaveId == null) return
    loading.value = true
    errorMessage.value = ''
    leave.value = null
    try {
      leave.value = await getLeave(props.leaveId)
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('leave.error.loadFailed')
    } finally {
      loading.value = false
    }
  },
)
</script>
