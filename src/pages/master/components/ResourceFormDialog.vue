<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('resourceManagement.form.editTitle') }}</v-card-title>
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
          autocomplete="off"
          @submit.prevent="handleSubmit"
        >
          <v-text-field
            v-model="form.resourceCode"
            density="compact"
            :label="t('resourceManagement.form.resourceCode')"
            :rules="[rules.resourceCodeRequired]"
            variant="outlined"
          />
          <v-text-field
            v-model="form.resourceName"
            density="compact"
            :label="t('resourceManagement.form.resourceName')"
            :rules="[rules.resourceNameRequired]"
            variant="outlined"
          />
          <v-card
            v-if="form.resourceName && translations.length > 0"
            class="mb-4"
            variant="outlined"
          >
            <v-card-subtitle class="pt-2">
              {{ t('resourceManagement.translationPreview.title') }}
            </v-card-subtitle>
            <v-list density="compact">
              <v-list-item
                v-for="item in translations"
                :key="item.locale"
              >
                <v-list-item-title>
                  <span class="text-medium-emphasis mr-2">{{ item.label }}:</span>
                  {{ item.value }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
          <IconSelect
            v-model="form.icon"
            density="compact"
            :label="t('resourceManagement.form.icon')"
          />
          <v-text-field
            v-model.number="form.sortOrder"
            density="compact"
            :label="t('resourceManagement.form.sortOrder')"
            type="number"
            variant="outlined"
          />
          <EnumSelect
            v-if="detail?.type !== 0"
            v-model="form.roleCode"
            display-field="code"
            :label="t('resourceManagement.form.roleCode')"
            show-subtitle
            type="role-code"
          />
          <EnumSelect
            v-model="form.status"
            :label="t('resourceManagement.form.status')"
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
          {{ t('resourceManagement.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading || confirmDialog"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('resourceManagement.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="confirmDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('resourceManagement.form.confirmTitle') }}</v-card-title>
        <v-card-text>
          {{ t('resourceManagement.form.confirmEditMessage') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="submitting"
            variant="text"
            @click="confirmDialog = false"
          >
            {{ t('resourceManagement.form.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            variant="elevated"
            @click="confirmSubmit"
          >
            {{ t('resourceManagement.form.confirmYes') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { ResourceInfoResponse } from '@/api/schemas/resource'
import type { VForm } from 'vuetify/components'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getResource, updateResource } from '@/api/modules/resource'
import EnumSelect from '@/components/EnumSelect.vue'
import IconSelect from '@/components/IconSelect.vue'
import { ENABLED_LOCALES, type SupportedLocale } from '@/composables/useLocale'
import enMessages from '@/locales/en'
import jaMessages from '@/locales/ja'
import zhMessages from '@/locales/zh'
import { useSnackbarStore } from '@/stores/snackbar'

const props = defineProps<{
  modelValue: boolean
  resourceId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const snackbar = useSnackbarStore()

const form = reactive<{
  resourceCode: string
  resourceName: string
  icon: string
  sortOrder: number | null
  roleCode: string | null
  status: string
}>({
  resourceCode: '',
  resourceName: '',
  icon: '',
  sortOrder: 0,
  roleCode: null,
  status: '1',
})

const detail = ref<ResourceInfoResponse | null>(null)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const confirmDialog = ref(false)

function getTranslation(locale: SupportedLocale, key: string): string {
  const messages = { en: enMessages, ja: jaMessages, zh: zhMessages }[locale]
  const parts = key.split('.')
  let current: unknown = messages
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  return typeof current === 'string' ? current : key
}

const translations = computed(() =>
  ENABLED_LOCALES.map(code => ({
    locale: code,
    label: t(`resourceManagement.translationPreview.${code}`),
    value: getTranslation(code, form.resourceName),
  })),
)

const rules = {
  resourceCodeRequired: (v: string) =>
    !!v || t('resourceManagement.validation.resourceCodeRequired'),
  resourceNameRequired: (v: string) =>
    !!v || t('resourceManagement.validation.resourceNameRequired'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) {
      confirmDialog.value = false
      return
    }
    if (props.resourceId == null) return
    errorMessage.value = ''
    loading.value = true
    try {
      const data = await getResource(props.resourceId)
      detail.value = data
      form.resourceCode = data.resourceCode
      form.resourceName = data.resourceName
      form.icon = data.icon ?? ''
      form.sortOrder = data.sortOrder ?? 0
      form.roleCode = data.roleCode ?? null
      form.status = data.status ?? '1'
      formRef.value?.resetValidation()
    } catch (error: unknown) {
      errorMessage.value =
        error instanceof Error ? error.message : t('resourceManagement.error.loadFailed')
    } finally {
      loading.value = false
    }
  },
)

async function handleSubmit() {
  if (!formRef.value || props.resourceId == null || detail.value == null) return
  const { valid } = await formRef.value.validate()
  if (!valid) return
  confirmDialog.value = true
}

async function confirmSubmit() {
  if (props.resourceId == null || detail.value == null) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await updateResource({
      id: props.resourceId,
      resourceCode: form.resourceCode,
      resourceName: form.resourceName,
      type: detail.value.type,
      parentId: detail.value.parentId,
      routePath: detail.value.routePath,
      icon: form.icon || null,
      sortOrder: form.sortOrder ?? null,
      roleCode: form.roleCode || null,
      status: form.status || null,
      version: detail.value.version,
    })
    confirmDialog.value = false
    snackbar.success(t('common.updateSuccess'))
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    confirmDialog.value = false
    errorMessage.value =
      error instanceof Error ? error.message : t('resourceManagement.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
