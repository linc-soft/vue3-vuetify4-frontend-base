<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 560"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('leave.review.title') }}</v-card-title>
      <v-card-text>
        <template v-if="task">
          <v-list
            class="mb-2"
            density="compact"
          >
            <v-list-item :title="t('leave.table.leaveType')">
              <template #subtitle>{{ leaveTypeLabelOf(task.leaveType) }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.table.startTime')">
              <template #subtitle>{{ formatDateTime(task.startTime) }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.table.endTime')">
              <template #subtitle>{{ formatDateTime(task.endTime) }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.table.days')">
              <template #subtitle>{{ task.days ?? '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('leave.submit.reason')">
              <template #subtitle>{{ task.reason || '-' }}</template>
            </v-list-item>
          </v-list>
          <v-textarea
            v-model="comment"
            :label="t('leave.review.comment')"
            rows="3"
          />
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
        <v-btn
          color="error"
          :disabled="submitting"
          :loading="submitting && decision === false"
          variant="tonal"
          @click="handleReview(false)"
        >
          {{ t('leave.review.reject') }}
        </v-btn>
        <v-spacer />
        <v-btn
          :disabled="submitting"
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('leave.review.cancel') }}
        </v-btn>
        <v-btn
          color="success"
          :disabled="submitting"
          :loading="submitting && decision === true"
          variant="elevated"
          @click="handleReview(true)"
        >
          {{ t('leave.review.approve') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { LeaveTaskResponseItem } from '@/api/schemas/leave'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { reviewLeave } from '@/api/modules/leave'
import { useEnums } from '@/composables/useEnums'

const props = defineProps<{
  modelValue: boolean
  task: LeaveTaskResponseItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'reviewed'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { labelOf: leaveTypeLabelOf } = useEnums('leave-type')

const comment = ref('')
const submitting = ref(false)
const decision = ref<boolean | null>(null)
const errorMessage = ref('')

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '-'
}

watch(
  () => props.modelValue,
  open => {
    if (!open) return
    comment.value = ''
    errorMessage.value = ''
    decision.value = null
  },
)

async function handleReview(approved: boolean) {
  if (!props.task) return
  submitting.value = true
  decision.value = approved
  errorMessage.value = ''
  try {
    await reviewLeave({ id: props.task.leaveId, approved, comment: comment.value || undefined })
    emit('reviewed')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('leave.error.reviewFailed')
  } finally {
    submitting.value = false
    decision.value = null
  }
}
</script>
