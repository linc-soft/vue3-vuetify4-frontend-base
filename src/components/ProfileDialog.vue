<script lang="ts" setup>
import type { ProfileUpdateRequest } from '@/api/schemas/auth'
import type { VForm } from 'vuetify/components'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useEnums } from '@/composables/useEnums'
import { LOCALE_LABELS, type SupportedLocale, useLocale } from '@/composables/useLocale'
import { useAuthStore } from '@/stores/auth'
import { useSnackbarStore } from '@/stores/snackbar'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const { mobile } = useDisplay()
const authStore = useAuthStore()
const snackbar = useSnackbarStore()
const { setLocale, enabled: enabledLocales } = useLocale()
const { options: genderOptions } = useEnums('gender')
const { labelOf: statusLabelOf } = useEnums('user-status')

const dialog = ref(false)
const confirmDialog = ref(false)
const formRef = ref<InstanceType<typeof VForm> | null>(null)
const formValid = ref(false)
const loading = ref(false)
const submitting = ref(false)

const form = reactive<ProfileUpdateRequest & { language: SupportedLocale }>({
  realName: '',
  mobile: '',
  gender: null,
  birthday: null,
  language: 'en',
  version: 0,
})

const statusLabel = computed(() => {
  const status = authStore.profile?.status
  return status == null ? '-' : statusLabelOf(status)
})

const languageItems = computed(() =>
  enabledLocales.map(code => ({
    title: LOCALE_LABELS[code],
    value: code,
  })),
)

watch(
  () => props.modelValue,
  val => {
    dialog.value = val
    if (val) loadProfile()
  },
)

watch(dialog, val => {
  emit('update:modelValue', val)
})

async function loadProfile() {
  loading.value = true
  try {
    const profile = await authStore.fetchProfile()
    form.realName = profile.realName ?? ''
    form.mobile = profile.mobile ?? ''
    form.gender = profile.gender ?? null
    form.birthday = profile.birthday ?? null
    form.language = (profile.language as SupportedLocale) ?? enabledLocales[0] ?? 'en'
    form.version = profile.version
  } catch (error: unknown) {
    snackbar.error(error instanceof Error ? error.message : t('profile.loadFailed'))
    dialog.value = false
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return
  confirmDialog.value = true
}

async function confirmSubmit() {
  submitting.value = true
  try {
    const previousLanguage = authStore.profile?.language
    const updated = await authStore.updateMyProfile({ ...form })
    await authStore.fetchProfile()
    snackbar.success(t('profile.saveSuccess'))
    if (updated.language && updated.language !== previousLanguage) {
      setLocale(updated.language as SupportedLocale)
    }
    confirmDialog.value = false
    dialog.value = false
  } catch (error: unknown) {
    snackbar.error(error instanceof Error ? error.message : t('profile.saveFailed'))
    confirmDialog.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 720"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 pa-4">
        <v-icon
          class="mr-2"
          icon="mdi-account-details"
        />
        {{ $t('profile.title') }}
      </v-card-title>

      <v-card-text class="pa-4 pt-0">
        <v-progress-linear
          v-if="loading"
          indeterminate
        />

        <v-form
          ref="formRef"
          v-model="formValid"
          autocomplete="off"
          @submit.prevent="handleSubmit"
        >
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <h3 class="text-subtitle-1 mb-4 font-weight-medium">
                {{ $t('profile.accountInfo') }}
              </h3>

              <v-text-field
                density="compact"
                :label="$t('profile.username')"
                :model-value="authStore.profile?.username ?? ''"
                readonly
                variant="outlined"
              />

              <v-text-field
                density="compact"
                :label="$t('profile.email')"
                :model-value="authStore.profile?.email ?? ''"
                readonly
                variant="outlined"
              />

              <v-text-field
                density="compact"
                :label="$t('profile.department')"
                :model-value="authStore.profile?.deptName ?? '-'"
                readonly
                variant="outlined"
              />

              <v-text-field
                density="compact"
                :label="$t('profile.position')"
                :model-value="authStore.profile?.positionName ?? '-'"
                readonly
                variant="outlined"
              />

              <v-text-field
                density="compact"
                :label="$t('profile.status')"
                :model-value="statusLabel"
                readonly
                variant="outlined"
              />
            </v-col>

            <v-col
              cols="12"
              md="6"
            >
              <h3 class="text-subtitle-1 mb-4 font-weight-medium">
                {{ $t('profile.editInfo') }}
              </h3>

              <v-text-field
                v-model="form.realName"
                density="compact"
                :label="$t('profile.realName')"
                maxlength="64"
                variant="outlined"
              />

              <v-text-field
                v-model="form.mobile"
                density="compact"
                :label="$t('profile.mobile')"
                maxlength="20"
                variant="outlined"
              />

              <v-select
                v-model="form.gender"
                clearable
                density="compact"
                :items="genderOptions"
                :label="$t('profile.gender')"
                variant="outlined"
              />

              <v-text-field
                v-model="form.birthday"
                clearable
                density="compact"
                :label="$t('profile.birthday')"
                type="date"
                variant="outlined"
              />

              <v-select
                v-model="form.language"
                density="compact"
                :items="languageItems"
                :label="$t('profile.language')"
                variant="outlined"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn
          :disabled="submitting"
          variant="text"
          @click="dialog = false"
        >
          {{ $t('profile.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!formValid || loading"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ $t('profile.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="confirmDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ $t('profile.confirmTitle') }}</v-card-title>
        <v-card-text>{{ $t('profile.confirmMessage') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="submitting"
            variant="text"
            @click="confirmDialog = false"
          >
            {{ $t('profile.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            variant="elevated"
            @click="confirmSubmit"
          >
            {{ $t('profile.confirmYes') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>
