<script lang="ts" setup>
import type { NavItem } from '@/layouts/navItems'
import { useI18n } from 'vue-i18n'

defineProps<{
  modelValue: boolean
  items: NavItem[]
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="pa-4 text-h6">{{ t('nav.admin') }}</div>

    <v-divider />

    <v-list
      density="compact"
      nav
    >
      <template
        v-for="item in items"
        :key="item.to || item.title"
      >
        <v-list-item
          v-if="!item.children"
          :prepend-icon="item.icon"
          :title="t(item.title)"
          :to="item.to"
        />

        <v-list-group
          v-else
          :value="item.title"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :prepend-icon="item.icon"
              :title="t(item.title)"
            />
          </template>

          <v-list-item
            v-for="child in item.children"
            :key="child.to"
            :prepend-icon="child.icon"
            :title="t(child.title)"
            :to="child.to"
          />
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>
