<script lang="ts" setup>
import type { VForm } from 'vuetify/components'
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { changePassword } from '@/api/modules/auth'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { t } = useI18n()
const dialog = ref(false)
const formRef = ref<InstanceType<typeof VForm> | null>(null)
const formValid = ref(false)
const submitting = ref(false)
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
})

watch(
  () => props.modelValue,
  val => {
    dialog.value = val
    if (val) {
      form.currentPassword = ''
      form.newPassword = ''
      form.confirmNewPassword = ''
      errorMessage.value = ''
      successMessage.value = ''
    }
  },
)

watch(dialog, val => {
  emit('update:modelValue', val)
})

const rules = {
  required: (v: string) => !!v || t('changePassword.required'),
  minLength: (v: string) => (!v || v.length >= 8 ? true : t('changePassword.minLength')),
  passwordMatch: (v: string) => v === form.newPassword || t('changePassword.passwordMismatch'),
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await changePassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    successMessage.value = t('changePassword.successMessage')
    setTimeout(() => {
      dialog.value = false
    }, 2000)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('changePassword.submit')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    max-width="480"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 pa-4">
        <v-icon
          class="mr-2"
          icon="mdi-key-variant"
        />
        {{ $t('changePassword.title') }}
      </v-card-title>

      <v-card-text class="pa-4 pt-0">
        <v-form
          ref="formRef"
          v-model="formValid"
          @submit.prevent="handleSubmit"
        >
          <v-text-field
            v-model="form.currentPassword"
            :append-inner-icon="showCurrentPassword ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="current-password"
            class="mb-2"
            :disabled="submitting"
            :label="$t('changePassword.currentPassword')"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[rules.required]"
            :type="showCurrentPassword ? 'text' : 'password'"
            variant="outlined"
            @click:append-inner="showCurrentPassword = !showCurrentPassword"
          />

          <v-text-field
            v-model="form.newPassword"
            :append-inner-icon="showNewPassword ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="new-password"
            class="mb-2"
            :disabled="submitting"
            :label="$t('changePassword.newPassword')"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[rules.required, rules.minLength]"
            :type="showNewPassword ? 'text' : 'password'"
            variant="outlined"
            @click:append-inner="showNewPassword = !showNewPassword"
          />

          <v-text-field
            v-model="form.confirmNewPassword"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            autocomplete="new-password"
            class="mb-2"
            :disabled="submitting"
            :label="$t('changePassword.confirmNewPassword')"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[rules.required, rules.passwordMatch]"
            :type="showConfirmPassword ? 'text' : 'password'"
            variant="outlined"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          />

          <v-alert
            v-if="successMessage"
            class="mb-2"
            density="compact"
            type="success"
            variant="tonal"
          >
            {{ successMessage }}
          </v-alert>

          <v-alert
            v-if="errorMessage"
            class="mb-2"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn
          :disabled="submitting"
          variant="text"
          @click="dialog = false"
        >
          {{ $t('changePassword.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="!formValid"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ $t('changePassword.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
