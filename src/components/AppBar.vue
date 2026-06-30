<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import ExportTaskDialog from '@/components/ExportTaskDialog.vue'
import { useLocale } from '@/composables/useLocale'
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  'toggle-drawer': []
}>()

const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()
const { current: currentLocale, enabled, canSwitch, labels, setLocale } = useLocale()

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

    <v-menu
      v-if="canSwitch"
      offset="8"
    >
      <template #activator="{ props }">
        <v-btn
          :aria-label="t('app.language')"
          icon="mdi-translate"
          variant="text"
          v-bind="props"
        >
          <v-icon>mdi-translate</v-icon>
          <v-tooltip
            activator="parent"
            location="bottom"
          >
            {{ t('app.language') }}
          </v-tooltip>
        </v-btn>
      </template>

      <v-list
        density="compact"
        min-width="160"
        :selected="[currentLocale]"
      >
        <v-list-item
          v-for="code in enabled"
          :key="code"
          :active="currentLocale === code"
          :title="labels[code]"
          :value="code"
          @click="setLocale(code)"
        />
      </v-list>
    </v-menu>

    <v-menu offset="8">
      <template #activator="{ props }">
        <v-btn
          append-icon="mdi-chevron-down"
          prepend-icon="mdi-account-circle"
          variant="text"
          v-bind="props"
        >
          <span class="d-none d-sm-inline">{{ authStore.username }}</span>
        </v-btn>
      </template>

      <v-list
        density="compact"
        min-width="160"
      >
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
  </v-app-bar>
</template>
