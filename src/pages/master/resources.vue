<template>
  <v-container>
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="3"
      >
        <v-text-field
          v-model="keyword"
          clearable
          density="compact"
          hide-details
          :label="t('resourceManagement.search.keyword')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-select
          v-model="typeFilter"
          clearable
          density="compact"
          hide-details
          :items="typeOptions"
          :label="t('resourceManagement.search.type')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-select
          v-model="statusFilter"
          clearable
          density="compact"
          hide-details
          :items="statusOptions"
          :label="t('resourceManagement.search.status')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="auto"
      >
        <v-btn
          variant="outlined"
          @click="fetchTree"
        >
          {{ t('resourceManagement.actions.refresh') }}
        </v-btn>
      </v-col>
    </v-row>

    <v-card
      class="mt-4"
      variant="outlined"
    >
      <div
        v-if="loading"
        class="d-flex justify-center py-8"
      >
        <v-progress-circular indeterminate />
      </div>
      <div
        v-else-if="filteredTree.length === 0"
        class="text-medium-emphasis pa-6 text-center"
      >
        {{ t('resourceManagement.empty') }}
      </div>
      <v-treeview
        v-else
        :item-title="itemTitle"
        item-value="id"
        :items="filteredTree"
        open-all
      >
        <template #prepend="{ item }">
          <v-icon
            v-if="item.icon"
            :color="item.status === '1' ? 'primary' : 'grey'"
            :icon="item.icon"
          />
          <v-icon
            v-else
            color="primary"
            icon="mdi-circle-medium"
          />
        </template>
        <template #append="{ item }">
          <span
            v-if="item.resourceCode"
            class="text-disabled text-caption mr-2"
          >
            {{ item.resourceCode }}
          </span>
          <v-chip
            v-if="item.roleCode"
            class="mr-2"
            color="info"
            size="x-small"
            variant="tonal"
          >
            {{ item.roleCode }}
          </v-chip>
          <v-chip
            class="mr-2"
            :color="item.type === 0 ? 'warning' : item.type === 1 ? 'success' : 'secondary'"
            size="x-small"
            variant="tonal"
          >
            {{ resourceTypeLabelOf(item.type) }}
          </v-chip>
          <v-chip
            v-if="item.status !== '1'"
            class="mr-2"
            color="grey"
            size="x-small"
            variant="tonal"
          >
            {{ commonStatusLabelOf(item.status ?? '') }}
          </v-chip>
          <v-btn
            v-perm="'resource:update'"
            density="compact"
            :icon="iconOf('resource:update', 'mdi-pencil-outline')"
            size="small"
            :title="t('resourceManagement.actions.edit')"
            variant="text"
            @click.stop="openEdit(item.id)"
          />
        </template>
      </v-treeview>
    </v-card>

    <ResourceFormDialog
      v-model="formDialog"
      :resource-id="selectedId"
      @saved="fetchTree"
    />
  </v-container>
</template>

<script lang="ts" setup>
import type { ResourceNode } from '@/api/schemas/resource'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getResourceTree } from '@/api/modules/resource'
import { useEnums } from '@/composables/useEnums'
import { useResourceIcon } from '@/composables/useResourceIcon'
import ResourceFormDialog from './components/ResourceFormDialog.vue'

const { t } = useI18n()
const { labelOf: resourceTypeLabelOf } = useEnums('resource-type')
const { options: typeOptions } = useEnums('resource-type')
const { options: statusOptions, labelOf: commonStatusLabelOf } = useEnums('common-status')
const { iconOf } = useResourceIcon()

const tree = ref<ResourceNode[]>([])
const loading = ref(false)
const keyword = ref('')
const typeFilter = ref<string | null>(null)
const statusFilter = ref<string | null>(null)

const formDialog = ref(false)
const selectedId = ref<number | null>(null)

function itemTitle(item: Record<string, unknown>): string {
  return t(String(item.resourceName))
}

function matchesFilters(node: ResourceNode): boolean {
  if (typeFilter.value && String(node.type) !== typeFilter.value) {
    return false
  }
  if (statusFilter.value && node.status !== statusFilter.value) {
    return false
  }
  if (keyword.value) {
    const k = keyword.value.toLowerCase()
    const name = t(node.resourceName).toLowerCase()
    if (!node.resourceCode.toLowerCase().includes(k) && !name.includes(k)) {
      return false
    }
  }
  return true
}

function filterNodes(nodes: ResourceNode[]): ResourceNode[] {
  const result: ResourceNode[] = []
  for (const node of nodes) {
    const children = filterNodes(node.children)
    if (matchesFilters(node) || children.length > 0) {
      result.push({ ...node, children })
    }
  }
  return result
}

const filteredTree = computed(() => filterNodes(tree.value))

async function fetchTree() {
  loading.value = true
  try {
    tree.value = await getResourceTree()
  } catch (error: unknown) {
    console.error('Failed to fetch resource tree:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTree()
})

function openEdit(id: number) {
  selectedId.value = id
  formDialog.value = true
}
</script>
