<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>
        {{ mode === 'create' ? t('position.form.createTitle') : t('position.form.editTitle') }}
      </v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <v-form
          v-else
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <v-text-field
            v-model="form.positionName"
            density="compact"
            :label="t('position.form.positionName')"
            :rules="[rules.positionNameRequired]"
            variant="outlined"
          />
          <v-text-field
            v-model="form.positionCode"
            density="compact"
            :label="t('position.form.positionCode')"
            variant="outlined"
          />
          <v-text-field
            v-model.number="form.sortOrder"
            density="compact"
            :label="t('position.form.sortOrder')"
            type="number"
            variant="outlined"
          />
          <EnumSelect
            v-model="form.status"
            :label="t('position.form.status')"
            type="common-status"
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
          {{ t('position.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('position.form.submit') }}
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

import { createPosition, getPosition, updatePosition } from '@/api/modules/position'
import EnumSelect from '@/components/EnumSelect.vue'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  positionId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()

const form = reactive<{
  positionName: string
  positionCode: string
  sortOrder: number | null
  status: string
}>({
  positionName: '',
  positionCode: '',
  sortOrder: 0,
  status: '1',
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const rules = {
  positionNameRequired: (v: string) => !!v || t('position.validation.positionNameRequired'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) return
    errorMessage.value = ''
    loading.value = true
    try {
      const position =
        props.mode === 'edit' && props.positionId != null
          ? await getPosition(props.positionId)
          : null

      if (props.mode === 'create') {
        form.positionName = ''
        form.positionCode = ''
        form.sortOrder = 0
        form.status = '1'
        version.value = 0
        formRef.value?.resetValidation()
      } else if (position) {
        form.positionName = position.positionName
        form.positionCode = position.positionCode ?? ''
        form.sortOrder = position.sortOrder ?? 0
        form.status = position.status
        version.value = position.version
      }
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('position.error.loadFailed')
    } finally {
      loading.value = false
    }
  },
)

async function handleSubmit() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  submitting.value = true
  errorMessage.value = ''
  try {
    await (props.mode === 'create'
      ? createPosition({
          positionName: form.positionName,
          positionCode: form.positionCode || undefined,
          sortOrder: form.sortOrder ?? undefined,
          status: form.status || undefined,
        })
      : updatePosition({
          id: props.positionId!,
          positionName: form.positionName,
          positionCode: form.positionCode || undefined,
          sortOrder: form.sortOrder ?? undefined,
          status: form.status || undefined,
          version: version.value,
        }))
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('position.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
