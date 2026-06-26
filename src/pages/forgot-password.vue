<template>
  <v-container
    class="fill-height position-relative"
    fluid
  >
    <div
      v-if="canSwitch"
      class="login-locale-switcher"
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
              icon="mdi-key-variant"
              size="32"
            />
            {{ t('forgotPassword.title') }}
          </v-card-title>

          <v-card-text>
            <v-form
              ref="formRef"
              v-model="formValid"
              @submit.prevent="handleSubmit"
            >
              <v-text-field
                v-model="form.usernameOrEmail"
                autocomplete="username"
                class="mb-2"
                :disabled="loading || submitted"
                :label="t('forgotPassword.usernameOrEmail')"
                prepend-inner-icon="mdi-account-outline"
                :rules="[rules.required]"
                variant="outlined"
              />

              <v-alert
                v-if="successMessage"
                class="mb-4"
                closable
                density="compact"
                type="success"
                variant="tonal"
                @click:close="successMessage = ''"
              >
                {{ successMessage }}
              </v-alert>

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
                v-if="!submitted"
                block
                color="primary"
                :disabled="!formValid"
                :loading="loading"
                size="large"
                type="submit"
              >
                {{ t('forgotPassword.submit') }}
              </v-btn>
            </v-form>

            <div class="text-center mt-4">
              <router-link
                class="text-body-2 text-decoration-none"
                :to="{ name: 'login' }"
              >
                {{ t('forgotPassword.backToLogin') }}
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
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { forgotPassword } from '@/api/modules/auth'
import { useLocale } from '@/composables/useLocale'

const { t } = useI18n()
const {
  current: currentLocale,
  enabled: enabledLocales,
  canSwitch,
  labels: localeLabels,
  setLocale,
} = useLocale()

const formRef = ref<InstanceType<typeof VForm> | null>(null)
const formValid = ref(false)
const loading = ref(false)
const submitted = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  usernameOrEmail: '',
})

const rules = {
  required: (v: string) => !!v || t('login.required'),
}

async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await forgotPassword({ usernameOrEmail: form.usernameOrEmail })
    successMessage.value = t('forgotPassword.successMessage')
    submitted.value = true
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('forgotPassword.sendFailed')
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
