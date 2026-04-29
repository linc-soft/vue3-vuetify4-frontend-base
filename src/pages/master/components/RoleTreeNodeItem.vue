<template>
  <div :style="{ paddingLeft: `${node.depth * 20}px` }">
    <div
      class="d-flex align-center py-1"
      :class="{ 'text-warning': node.isRedundant }"
    >
      <v-icon
        v-if="node.children.length > 0"
        class="mr-1"
        :icon="expanded ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        size="x-small"
        @click="expanded = !expanded"
      />
      <v-icon
        v-else
        class="mr-1"
        icon="mdi-circle-small"
        size="x-small"
      />
      <v-icon
        class="mr-1"
        :color="node.isRedundant ? 'warning' : undefined"
        :icon="node.isRedundant ? 'mdi-alert-circle-outline' : 'mdi-account-outline'"
        size="x-small"
      />
      <span class="text-body-2">{{ node.roleName }}</span>
      <span class="text-caption text-medium-emphasis ml-1">({{ node.roleCode }})</span>
      <v-tooltip
        v-if="node.isRedundant"
        location="top"
      >
        <template #activator="{ props: tooltipProps }">
          <v-chip
            v-bind="tooltipProps"
            class="ml-2"
            color="warning"
            density="compact"
            label
            size="x-small"
            variant="tonal"
          >
            {{ t('role.form.redundantWarning') }}
          </v-chip>
        </template>
        {{ t('role.form.redundantWarning') }}
      </v-tooltip>
      <v-btn
        v-if="node.depth === 0"
        class="ml-1"
        density="compact"
        icon="mdi-close-circle-outline"
        size="x-small"
        variant="text"
        @click="emit('remove', node.id)"
      />
    </div>
    <div v-if="expanded && node.children.length > 0">
      <RoleTreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @remove="emit('remove', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { RoleTreeNode } from '@/composables/useRoleInheritance'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  node: RoleTreeNode
}>()

const emit = defineEmits<{
  (e: 'remove', roleId: number): void
}>()

const { t } = useI18n()
const expanded = ref(true)
</script>
