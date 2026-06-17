<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

function goHome() {
  router.replace({ name: 'home' })
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    goHome()
  }
}
</script>

<template>
  <v-container
    class="d-flex align-center justify-center"
    style="min-height: 80vh"
  >
    <v-card
      class="pa-8 text-center"
      max-width="480"
      variant="flat"
    >
      <v-icon
        color="warning"
        icon="mdi-shield-lock-outline"
        size="64"
      />
      <div class="text-h4 mt-4">403</div>
      <div class="text-h6 mt-2">{{ t('forbidden.title') }}</div>
      <div class="text-body-2 text-medium-emphasis mt-2">
        {{ t('forbidden.description') }}
      </div>
      <div class="d-flex justify-center mt-6 ga-3">
        <v-btn
          color="primary"
          @click="goHome"
        >
          {{ t('forbidden.home') }}
        </v-btn>
        <v-btn
          variant="outlined"
          @click="goBack"
        >
          {{ t('forbidden.back') }}
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>
