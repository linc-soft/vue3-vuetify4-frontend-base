<template>
  <v-container
    class="fill-height position-relative"
    fluid
  >
    <div
      v-if="canSwitch"
      class="force-change-password-locale-switcher"
    >
      <v-menu offset="8">
        <template #activator="{ props }">
          <v-btn
            :aria-label="t('app.language')"
            icon="mdi-translate"
            variant="text"
            v-bind="props"
          />
        </template>

        <v-list
          density="compact"
          min-width="160"
          :selected="[currentLocale]"
        >
          <v-list-item
            v-for="code in enabledLocales"
            :key="code"
            :active="currentLocale === code"
            :title="localeLabels[code]"
            :value="code"
            @click="setLocale(code)"
          />
        </v-list>
      </v-menu>
    </div>

    <v-row
      align="center"
      justify="center"
    >
      <v-col
        cols="12"
        lg="4"
        md="5"
        sm="8"
      >
        <v-card
          class="pa-4"
          elevation="8"
          rounded="lg"
        >
          <v-card-title class="text-center text-h5 pb-2">
            <v-icon
              class="mr-2"
              icon="mdi-lock-reset"
              size="32"
            />
            {{ t('forceChangePassword.title') }}
          </v-card-title>

          <v-card-text>
            <v-alert
              class="mb-4"
              density="compact"
              type="warning"
              variant="tonal"
            >
              {{ t('forceChangePassword.description') }}
            </v-alert>

            <v-form
              ref="formRef"
              v-model="formValid"
              autocomplete="off"
              @submit.prevent="handleSubmit"
            >
              <v-text-field
                v-model="form.newPassword"
                class="mb-2"
                :disabled="loading"
                :label="t('forceChangePassword.newPassword')"
                prepend-inner-icon="mdi-lock-outline"
                :rules="[rules.required, rules.minLength]"
                type="password"
                variant="outlined"
              />

              <v-text-field
                v-model="form.confirmPassword"
                class="mb-2"
                :disabled="loading"
                :label="t('forceChangePassword.confirmPassword')"
                prepend-inner-icon="mdi-lock-check-outline"
                :rules="[rules.required, rules.minLength, rules.passwordMatch]"
                type="password"
                variant="outlined"
              />

              <v-alert
                v-if="errorMessage"
                class="mb-4"
                closable
                density="compact"
                type="error"
                variant="tonal"
                @click:close="errorMessage = ''"
              >
                {{ errorMessage }}
              </v-alert>

              <v-btn
                block
                color="primary"
                :disabled="!formValid"
                :loading="loading"
                size="large"
                type="submit"
              >
                {{ t('forceChangePassword.submit') }}
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn
              :disabled="loading"
              variant="text"
              @click="handleLogout"
            >
              {{ t('forceChangePassword.logout') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import type { VForm } from 'vuetify/components'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { ApiError } from '@/api/client'
import { forceChangePassword as apiForceChangePassword } from '@/api/modules/auth'
import { useLocale } from '@/composables/useLocale'
import { useAuthStore } from '@/stores/auth'
import { useSnackbarStore } from '@/stores/snackbar'

const { t } = useI18n()
const router = useRouter()
const {
  current: currentLocale,
  enabled: enabledLocales,
  canSwitch,
  labels: localeLabels,
  setLocale,
} = useLocale()
const authStore = useAuthStore()
const snackbar = useSnackbarStore()

const formRef = ref<InstanceType<typeof VForm> | null>(null)
const formValid = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  newPassword: '',
  confirmPassword: '',
})

const rules = {
  required: (v: string) => !!v || t('forceChangePassword.required'),
  minLength: (v: string) => v.length >= 8 || t('forceChangePassword.minLength'),
  passwordMatch: (v: string) => v === form.newPassword || t('forceChangePassword.passwordMismatch'),
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''

  try {
    await apiForceChangePassword({ newPassword: form.newPassword })
    authStore.requirePasswordChange = false
    snackbar.success(t('changePassword.successMessage'))
    await router.push({ name: 'home' })
  } catch (error: unknown) {
    errorMessage.value = error instanceof ApiError ? error.message : t('forceChangePassword.failed')
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  await authStore.logout()
  await router.push({ name: 'login' })
}
</script>

<style scoped>
.force-change-password-locale-switcher {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 1;
}
</style>
