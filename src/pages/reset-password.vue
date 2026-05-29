<template>
  <v-container
    class="fill-height position-relative"
    fluid
  >
    <div class="login-locale-switcher">
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
            v-for="code in supportedLocales"
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
            {{ t('resetPassword.title') }}
          </v-card-title>

          <v-card-text>
            <v-alert
              v-if="tokenInvalid"
              class="mb-4"
              density="compact"
              type="error"
              variant="tonal"
            >
              {{ t('resetPassword.tokenInvalidMessage') }}
            </v-alert>

            <v-alert
              v-if="successMessage"
              class="mb-4"
              density="compact"
              type="success"
              variant="tonal"
            >
              {{ successMessage }}
            </v-alert>

            <v-form
              v-if="!tokenInvalid && !successMessage"
              ref="formRef"
              v-model="formValid"
              @submit.prevent="handleSubmit"
            >
              <v-text-field
                v-model="form.newPassword"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                autocomplete="new-password"
                class="mb-2"
                :disabled="loading"
                :label="t('resetPassword.newPassword')"
                prepend-inner-icon="mdi-lock-outline"
                :rules="[rules.required, rules.minLength]"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPassword = !showPassword"
              />

              <v-text-field
                v-model="form.confirmNewPassword"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                autocomplete="new-password"
                class="mb-2"
                :disabled="loading"
                :label="t('resetPassword.confirmNewPassword')"
                prepend-inner-icon="mdi-lock-outline"
                :rules="[rules.required, rules.passwordMatch]"
                :type="showConfirmPassword ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
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
                {{ t('resetPassword.submit') }}
              </v-btn>
            </v-form>

            <div class="text-center mt-4">
              <router-link
                class="text-body-2 text-decoration-none"
                :to="{ name: 'login' }"
              >
                {{ t('resetPassword.backToLogin') }}
              </router-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import type { VForm } from 'vuetify/components'
import { onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { resetPassword } from '@/api/modules/auth'
import { useLocale } from '@/composables/useLocale'

const { t } = useI18n()
const {
  current: currentLocale,
  supported: supportedLocales,
  labels: localeLabels,
  setLocale,
} = useLocale()
const route = useRoute()
const router = useRouter()

const formRef = ref<InstanceType<typeof VForm> | null>(null)
const formValid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const tokenInvalid = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  newPassword: '',
  confirmNewPassword: '',
})

let token = ''

onMounted(() => {
  const tokenParam = route.query.token
  if (!tokenParam || typeof tokenParam !== 'string') {
    tokenInvalid.value = true
    return
  }
  token = tokenParam
})

const rules = {
  required: (v: string) => !!v || t('resetPassword.required'),
  minLength: (v: string) => (!v || v.length >= 8 ? true : t('resetPassword.minLength')),
  passwordMatch: (v: string) => v === form.newPassword || t('resetPassword.passwordMismatch'),
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''

  try {
    await resetPassword({ token, newPassword: form.newPassword })
    successMessage.value = t('resetPassword.successMessage')
    setTimeout(() => {
      router.replace({ name: 'login' })
    }, 3000)
  } catch (error: unknown) {
    const err = error as { code?: number }
    if (err.code === 999_404 || err.code === 999_410) {
      tokenInvalid.value = true
    } else {
      errorMessage.value =
        error instanceof Error ? error.message : t('resetPassword.tokenInvalidMessage')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-locale-switcher {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 1;
}
</style>
