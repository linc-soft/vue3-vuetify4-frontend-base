<template>
  <v-snackbar
    v-model="visible"
    class="app-snackbar"
    :color="color"
    location="top"
    :timeout="timeout"
  >
    {{ message }}
    <template #actions>
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        @click="close"
      />
    </template>
  </v-snackbar>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

import { useSnackbarStore } from '@/stores/snackbar'

const store = useSnackbarStore()
const { color, message, timeout } = storeToRefs(store)
const { close } = store

const visible = computed({
  get: () => store.visible,
  set: value => {
    store.visible = value
  },
})
</script>

<style scoped>
.app-snackbar :deep(.v-snackbar__wrapper) {
  margin-block-start: 8px !important;
}
</style>
