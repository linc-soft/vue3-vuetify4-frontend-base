<template>
  <v-container>
    <v-row justify="center">
      <v-col
        cols="12"
        lg="6"
        md="8"
      >
        <v-card :title="t('leave.apply.title')">
          <v-card-text>
            <v-form
              ref="formRef"
              @submit.prevent="handleSubmit"
            >
              <v-date-input
                v-model="form.startDate"
                density="compact"
                :label="t('leave.apply.startDate')"
                :rules="[v => !!v || t('leave.apply.required')]"
                variant="outlined"
              />
              <v-date-input
                v-model="form.endDate"
                density="compact"
                :label="t('leave.apply.endDate')"
                :rules="[v => !!v || t('leave.apply.required')]"
                variant="outlined"
              />
              <v-select
                v-model="form.leaveType"
                density="compact"
                :items="leaveTypeOptions"
                :label="t('leave.apply.leaveType')"
                :rules="[v => (v !== null && v !== undefined) || t('leave.apply.required')]"
                variant="outlined"
              />
              <v-text-field
                v-model.number="form.duration"
                density="compact"
                :label="t('leave.apply.duration')"
                :rules="[v => v > 0 || t('leave.apply.invalidDuration')]"
                step="0.5"
                type="number"
                variant="outlined"
              />
              <v-textarea
                v-model="form.reason"
                density="compact"
                :label="t('leave.apply.reason')"
                rows="3"
                :rules="[v => !!v || t('leave.apply.required')]"
                variant="outlined"
              />
              <v-file-input
                v-model="form.files"
                density="compact"
                :label="t('leave.apply.attachments')"
                multiple
                prepend-icon="mdi-paperclip"
                variant="outlined"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              variant="text"
              @click="resetForm"
              >{{ t('leave.apply.reset') }}</v-btn
            >
            <v-btn
              color="primary"
              :loading="loading"
              variant="elevated"
              @click="handleSubmit"
            >
              {{ t('leave.apply.submit') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog
      v-model="confirmDialog"
      :max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('leave.apply.confirmTitle') }}</v-card-title>
        <v-card-text>{{ t('leave.apply.confirmMessage') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="confirmDialog = false"
            >{{ t('leave.apply.cancel') }}</v-btn
          >
          <v-btn
            color="primary"
            :loading="loading"
            variant="elevated"
            @click="submitForm"
          >
            {{ t('leave.apply.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import type { SaveLeaveRequest } from '@/api/schemas/leave'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { uploadFile } from '@/api/modules/file'
import { createLeave } from '@/api/modules/leave'
import { useLeaveTypes } from '@/composables/useLeaveTypes'

const { t } = useI18n()
const router = useRouter()
const { options: leaveTypeOptions } = useLeaveTypes()

const loading = ref(false)
const confirmDialog = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const form = reactive({
  startDate: null as Date | null,
  endDate: null as Date | null,
  leaveType: null as number | null,
  duration: 0.5,
  reason: '',
  files: [] as File[],
})

function resetForm() {
  form.startDate = null
  form.endDate = null
  form.leaveType = null
  form.duration = 0.5
  form.reason = ''
  form.files = []
}

function handleSubmit() {
  confirmDialog.value = true
}

async function submitForm() {
  loading.value = true
  try {
    const fileIds: number[] = []
    for (const file of form.files) {
      const metadata = await uploadFile(file)
      if (metadata.id) fileIds.push(metadata.id)
    }

    const params: SaveLeaveRequest = {
      userId: 0, // Will be set from auth context
      startDate: form.startDate ? form.startDate.toISOString().split('T')[0] : '',
      endDate: form.endDate ? form.endDate.toISOString().split('T')[0] : '',
      leaveType: 'ANNUAL', // Will be mapped from form.leaveType
      duration: form.duration,
      reason: form.reason,
      fileIds: fileIds.length > 0 ? fileIds : undefined,
    }

    await createLeave(params)
    snackbarColor.value = 'success'
    snackbarText.value = t('leave.apply.success')
    snackbar.value = true
    resetForm()
    router.push({ name: 'leave-list' })
  } catch (error: unknown) {
    snackbarColor.value = 'error'
    snackbarText.value = error instanceof Error ? error.message : t('leave.apply.failed')
    snackbar.value = true
  } finally {
    loading.value = false
    confirmDialog.value = false
  }
}
</script>
