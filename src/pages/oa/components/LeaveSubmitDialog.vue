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
          <v-text-field
            v-model="form.startTime"
            :label="t('leave.submit.startTime')"
            :rules="[rules.startTimeRequired]"
            type="datetime-local"
          />
          <v-text-field
            v-model="form.endTime"
            :label="t('leave.submit.endTime')"
            :rules="[rules.endTimeRequired, rules.endAfterStart]"
            type="datetime-local"
          />
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
import { useEnums } from '@/composables/useEnums'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: leaveTypeOptions } = useEnums('leave-type')

const form = reactive<{
  leaveType: string
  startTime: string
  endTime: string
  days: number | null
  reason: string
}>({
  leaveType: '',
  startTime: '',
  endTime: '',
  days: null,
  reason: '',
})
const formRef = ref<VForm>()
const submitting = ref(false)
const errorMessage = ref('')

const rules = {
  leaveTypeRequired: (v: string) => !!v || t('leave.validation.leaveTypeRequired'),
  startTimeRequired: (v: string) => !!v || t('leave.validation.startTimeRequired'),
  endTimeRequired: (v: string) => !!v || t('leave.validation.endTimeRequired'),
  endAfterStart: (v: string) =>
    !v || !form.startTime || v > form.startTime || t('leave.validation.endAfterStart'),
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
    form.startTime = ''
    form.endTime = ''
    form.days = null
    form.reason = ''
    formRef.value?.resetValidation()
  },
)

// Convert a datetime-local value (yyyy-MM-ddTHH:mm) into a LocalDateTime
// string with seconds (yyyy-MM-ddTHH:mm:ss) for the backend.
function toLocalDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

async function handleSubmit() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  submitting.value = true
  errorMessage.value = ''
  try {
    await submitLeave({
      leaveType: form.leaveType,
      startTime: toLocalDateTime(form.startTime),
      endTime: toLocalDateTime(form.endTime),
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
