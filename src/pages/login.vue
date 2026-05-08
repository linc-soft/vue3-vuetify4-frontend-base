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
              icon="mdi-lock-outline"
              size="32"
            />
            {{ t('login.title') }}
          </v-card-title>

          <v-card-text>
            <v-form
              ref="formRef"
              v-model="formValid"
              @submit.prevent="handleLogin"
            >
              <v-text-field
                v-model="form.username"
                autocomplete="username"
                class="mb-2"
                :disabled="loading"
                :label="t('login.username')"
                prepend-inner-icon="mdi-account-outline"
                :rules="[rules.required]"
                variant="outlined"
              />

              <v-text-field
                v-model="form.password"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                autocomplete="current-password"
                class="mb-2"
                :disabled="loading"
                :label="t('login.password')"
                prepend-inner-icon="mdi-lock-outline"
                :rules="[rules.required]"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                @click:append-inner="showPassword = !showPassword"
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
                {{ t('login.submit') }}
              </v-btn>
            </v-form>
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
import { useRoute, useRouter } from 'vue-router'

import { useLocale } from '@/composables/useLocale'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const {
  current: currentLocale,
  supported: supportedLocales,
  labels: localeLabels,
  setLocale,
} = useLocale()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<InstanceType<typeof VForm> | null>(null)
const formValid = ref(false)
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  required: (v: string) => !!v || t('login.required'),
}

async function handleLogin() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.login({ username: form.username, password: form.password })
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('login.failed')
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
