<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'

defineEmits<{
  'toggle-drawer': []
}>()

const authStore = useAuthStore()
</script>

<template>
  <v-app-bar flat>
    <v-app-bar-nav-icon @click="$emit('toggle-drawer')" />

    <v-spacer />

    <span class="text-body-1 mr-4">{{ authStore.username }}</span>
  </v-app-bar>
</template>
