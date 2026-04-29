<script lang="ts" setup>
import type { NavItem } from '@/layouts/navItems'

defineProps<{
  modelValue: boolean
  items: NavItem[]
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="pa-4 text-h6">Admin</div>

    <v-divider />

    <v-list
      density="compact"
      nav
    >
      <v-list-item
        v-for="item in items"
        :key="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        :to="item.to"
      />
    </v-list>
  </v-navigation-drawer>
</template>
