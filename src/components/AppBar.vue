<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import ExportTaskDialog from '@/components/ExportTaskDialog.vue'
import ProfileDialog from '@/components/ProfileDialog.vue'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  'toggle-drawer': []
}>()

const authStore = useAuthStore()
const router = useRouter()

const showProfileDialog = ref(false)
const showChangePasswordDialog = ref(false)
const showExportTaskDialog = ref(false)

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
          <span class="d-none d-sm-inline">{{
            authStore.profile?.realName || authStore.username
          }}</span>
        </v-btn>
      </template>

      <v-list
        density="compact"
        min-width="160"
      >
        <v-list-item
          prepend-icon="mdi-account-details"
          :title="$t('app.profile')"
          @click="showProfileDialog = true"
        />
        <v-list-item
          prepend-icon="mdi-file-export"
          :title="$t('app.exportTasks')"
          @click="showExportTaskDialog = true"
        />
        <v-list-item
          prepend-icon="mdi-key-variant"
          :title="$t('app.changePassword')"
          @click="showChangePasswordDialog = true"
        />
        <v-list-item
          prepend-icon="mdi-logout"
          :title="$t('app.logout')"
          @click="handleLogout"
        />
      </v-list>
    </v-menu>

    <ExportTaskDialog v-model="showExportTaskDialog" />
    <ChangePasswordDialog v-model="showChangePasswordDialog" />
    <ProfileDialog v-model="showProfileDialog" />
  </v-app-bar>
</template>
