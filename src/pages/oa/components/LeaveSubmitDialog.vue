<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('leave.submit.title') }}</v-card-title>
      <v-card-text>
        <v-form
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <v-select
            v-model="form.leaveType"
            :items="leaveTypeOptions"
            :label="t('leave.submit.leaveType')"
            :rules="[rules.leaveTypeRequired]"
          />
          <div class="d-flex gap-2">
            <v-text-field
              v-model="form.startDate"
              :label="t('leave.submit.startDate')"
              :rules="[rules.startDateRequired]"
              type="date"
            />
            <v-select
              v-model="form.startPeriod"
              class="period-select"
              :items="periodOptions"
              :label="t('leave.submit.period')"
            />
          </div>
          <div class="d-flex gap-2">
            <v-text-field
              v-model="form.endDate"
              :label="t('leave.submit.endDate')"
              :rules="[rules.endDateRequired, rules.endAfterStart]"
              type="date"
            />
            <v-select
              v-model="form.endPeriod"
              class="period-select"
              :items="periodOptions"
              :label="t('leave.submit.period')"
            />
          </div>
          <v-text-field
            v-model.number="form.days"
            :hint="t('leave.submit.daysHint')"
            :label="t('leave.submit.days')"
            persistent-hint
            :rules="[rules.daysRequired, rules.daysHalfUnit]"
            step="0.5"
            type="number"
          />
          <v-textarea
            v-model="form.reason"
            :label="t('leave.submit.reason')"
            rows="3"
          />
        </v-form>
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
          :disabled="submitting"
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('leave.submit.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('leave.submit.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { VForm } from 'vuetify/components'
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { submitLeave } from '@/api/modules/leave'
import { useLeaveType } from '@/composables/useLeaveType'
import { usePeriodType } from '@/composables/usePeriodType'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: leaveTypeOptions } = useLeaveType()
const { options: periodOptions } = usePeriodType()

const form = reactive<{
  leaveType: string
  startDate: string
  startPeriod: '0' | '1'
  endDate: string
  endPeriod: '0' | '1'
  days: number | null
  reason: string
}>({
  leaveType: '',
  startDate: '',
  startPeriod: '0',
  endDate: '',
  endPeriod: '1',
  days: null,
  reason: '',
})

const formRef = ref<VForm>()
const submitting = ref(false)
const errorMessage = ref('')

function calculateDays(): number | null {
  if (!form.startDate || !form.endDate) return null

  const start = new Date(form.startDate)
  const end = new Date(form.endDate)
  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return null

  if (diffDays === 0) {
    if (form.startPeriod === '1' && form.endPeriod === '0') return null
    if (form.startPeriod === form.endPeriod) return 0.5
    return 1
  }

  let days = diffDays - 1

  days += form.startPeriod === '0' ? 1 : 0.5

  days += form.endPeriod === '1' ? 1 : 0.5

  return days
}

const rules = {
  leaveTypeRequired: (v: string) => !!v || t('leave.validation.leaveTypeRequired'),
  startDateRequired: (v: string) => !!v || t('leave.validation.startTimeRequired'),
  endDateRequired: (v: string) => !!v || t('leave.validation.endTimeRequired'),
  endAfterStart: () => {
    const startDt = new Date(`${form.startDate}T${form.startPeriod === '0' ? '09:00' : '13:00'}`)
    const endDt = new Date(`${form.endDate}T${form.endPeriod === '0' ? '12:00' : '18:00'}`)
    return (
      !form.startDate || !form.endDate || endDt > startDt || t('leave.validation.endAfterStart')
    )
  },
  daysRequired: (v: number | null) => (v !== null && v > 0) || t('leave.validation.daysRequired'),
  daysHalfUnit: (v: number | null) =>
    v === null || (v * 2) % 1 === 0 || t('leave.validation.daysHalfUnit'),
}

watch(
  () => props.modelValue,
  open => {
    if (!open) return
    errorMessage.value = ''
    form.leaveType = ''
    form.startDate = ''
    form.startPeriod = '0'
    form.endDate = ''
    form.endPeriod = '1'
    form.days = null
    form.reason = ''
    formRef.value?.resetValidation()
  },
)

watch(
  [() => form.startDate, () => form.startPeriod, () => form.endDate, () => form.endPeriod],
  () => {
    form.days = calculateDays()
  },
)

async function handleSubmit() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  submitting.value = true
  errorMessage.value = ''
  try {
    await submitLeave({
      leaveType: form.leaveType,
      startDate: form.startDate,
      startPeriod: form.startPeriod,
      endDate: form.endDate,
      endPeriod: form.endPeriod,
      days: form.days!,
      reason: form.reason || undefined,
    })
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('leave.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.period-select {
  max-width: 120px;
  min-width: 100px;
}
</style>
