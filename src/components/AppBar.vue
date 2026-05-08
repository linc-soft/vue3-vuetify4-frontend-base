<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  'toggle-drawer': []
}>()

const authStore = useAuthStore()
const router = useRouter()

async function handleLogout() {
  try {
    await authStore.logout()
  } finally {
    router.replace({ name: 'login' })
  }
}
</script>

<template>
  <v-app-bar flat>
    <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />

    <v-spacer />

    <v-menu offset="8">
      <template #activator="{ props }">
        <v-btn
          append-icon="mdi-chevron-down"
          prepend-icon="mdi-account-circle"
          variant="text"
          v-bind="props"
        >
          {{ authStore.username }}
        </v-btn>
      </template>

      <v-list
        density="compact"
        min-width="160"
      >
        <v-list-item
          prepend-icon="mdi-logout"
          :title="$t('app.logout')"
          @click="handleLogout"
        />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>
