<script lang="ts" setup>
import type { ResourceNode } from '@/api/schemas/resource'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePermissionStore } from '@/stores/permission'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const permStore = usePermissionStore()

const menuNodes = computed<ResourceNode[]>(() => permStore.resourceTree)

function isMenuLeaf(node: ResourceNode): boolean {
  return node.type === 1 && !!node.routePath && !node.routePath.includes(':')
}
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
        v-for="node in menuNodes"
        :key="node.id"
      >
        <v-list-item
          v-if="isMenuLeaf(node)"
          :prepend-icon="node.icon ?? undefined"
          :title="t(node.resourceName)"
          :to="node.routePath ?? undefined"
        />

        <v-list-group
          v-else-if="node.type === 0 && node.children?.length"
          :value="node.resourceCode"
        >
          <template #activator="{ props }">
            <v-list-item
              v-bind="props"
              :prepend-icon="node.icon ?? undefined"
              :title="t(node.resourceName)"
            />
          </template>

          <template
            v-for="child in node.children"
            :key="child.id"
          >
            <v-list-item
              v-if="isMenuLeaf(child)"
              :prepend-icon="child.icon ?? undefined"
              :title="t(child.resourceName)"
              :to="child.routePath ?? undefined"
            />
          </template>
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>
