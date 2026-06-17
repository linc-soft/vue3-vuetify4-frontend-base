<template>
  <v-container>
    <!-- Search and Filter Section -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col
        cols="12"
        md="3"
      >
        <v-text-field
          v-model="filters.roleName"
          clearable
          density="compact"
          hide-details
          :label="t('role.search.roleName')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-autocomplete
          v-model="filters.roleCode"
          clearable
          density="compact"
          hide-details
          item-value="code"
          :items="roleCodeItems"
          :label="t('role.search.roleCode')"
          variant="outlined"
        >
          <template #selection="{ item }">
            {{ item.code }}
          </template>
          <template #item="{ props: itemProps, item }">
            <v-list-item
              v-bind="itemProps"
              :subtitle="item.name"
              :title="item.code"
            />
          </template>
        </v-autocomplete>
      </v-col>
      <v-col
        cols="12"
        md="auto"
      >
        <v-checkbox
          v-model="filters.aggregatedOnly"
          density="compact"
          hide-details
          :label="t('role.search.aggregatedOnly')"
        />
      </v-col>
      <v-col
        cols="12"
        md="auto"
      >
        <v-btn
          class="mr-2"
          color="primary"
          variant="elevated"
          @click="handleSearch"
        >
          {{ t('role.search.search') }}
        </v-btn>
        <v-btn
          class="mr-2"
          variant="outlined"
          @click="handleReset"
        >
          {{ t('role.search.reset') }}
        </v-btn>
        <v-btn
          v-perm="'role:create'"
          color="primary"
          prepend-icon="mdi-plus"
          variant="tonal"
          @click="openForm('create')"
        >
          {{ t('role.actions.create') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Role List -->
    <v-data-table
      class="mt-4"
      :headers="allHeaders"
      :items="items"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :mobile="mobile"
      @update:items-per-page="itemsPerPage = $event"
    >
      <template #item.roleName="{ item }">
        {{ displayName(item) }}
      </template>
      <template #item.description="{ value }">
        {{ value ?? '-' }}
      </template>
      <template #item.updateAt="{ value }">
        {{ value ?? '-' }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          density="compact"
          icon="mdi-eye-outline"
          size="small"
          :title="t('role.actions.detail')"
          variant="text"
          @click="openDetail(item.id)"
        />
        <v-btn
          v-perm="'role:update'"
          density="compact"
          icon="mdi-pencil-outline"
          size="small"
          :title="t('role.actions.edit')"
          variant="text"
          @click="openForm('edit', item.id)"
        />
        <v-btn
          v-perm="'role:delete'"
          color="error"
          density="compact"
          icon="mdi-delete-outline"
          size="small"
          :title="t('role.actions.delete')"
          variant="text"
          @click="openDeleteConfirm(item)"
        />
      </template>
    </v-data-table>

    <!-- Role Detail Dialog -->
    <RoleDetailDialog
      v-model="detailDialog"
      :role-id="selectedRoleId"
      @deleted="fetchRoles"
    />

    <!-- Role Form Dialog -->
    <RoleFormDialog
      v-model="formDialog"
      :mode="formMode"
      :role-id="selectedRoleId"
      @saved="fetchRoles"
    />

    <!-- Delete Confirm Dialog -->
    <v-dialog
      v-model="deleteDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('role.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('role.delete.message') }}</p>
          <v-alert
            v-if="errorMessage"
            class="mt-3"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="deleteLoading"
            variant="text"
            @click="deleteDialog = false"
          >
            {{ t('role.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('role.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import type { RoleListResponseItem } from '@/api/schemas/role'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteRole, getRoleList } from '@/api/modules/role'
import { useEnums } from '@/composables/useEnums'
import { useRoleDisplay } from '@/composables/useRoleDisplay'
import RoleDetailDialog from './components/RoleDetailDialog.vue'
import RoleFormDialog from './components/RoleFormDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { displayName } = useRoleDisplay()

// Filter Conditions
const filters = reactive({
  roleName: '',
  roleCode: undefined,
  aggregatedOnly: true,
})

// Table data and loading state
const items = ref<RoleListResponseItem[]>([])
const loading = ref(false)
const itemsPerPage = ref(10)

// Role code enum options for the roleCode filter dropdown
const { items: roleCodeItems } = useEnums('role-code')

// Dialog Control
const detailDialog = ref(false)
const formDialog = ref(false)
const selectedRoleId = ref<number | null>(null)
const formMode = ref<'create' | 'edit'>('create')

// Deletion-related logic
const deleteDialog = ref(false)
const deleteTarget = ref<{ id: number; version: number } | null>(null)
const deleteLoading = ref(false)
const errorMessage = ref('')

// Last search state for column visibility — updated only on actual search
const lastSearchAggregatedOnly = ref(true)

// Table column definitions
const allHeaders = computed(() => {
  const headers = [
    { title: t('role.table.roleName'), key: 'roleName' },
    { title: t('role.table.roleCode'), key: 'roleCode' },
    { title: t('role.table.description'), key: 'description' },
    { title: t('role.table.updateBy'), key: 'updateBy' },
    { title: t('role.table.updateAt'), key: 'updateAt' },
    {
      title: t('role.table.actions'),
      key: 'actions',
      sortable: false,
      cellClass: 'column-actions',
    },
  ]
  if (lastSearchAggregatedOnly.value) {
    return headers.filter(h => h.key !== 'roleCode')
  }
  return headers
})

// Get role list
async function fetchRoles() {
  loading.value = true
  try {
    items.value = await getRoleList({
      roleName: filters.roleName || undefined,
      roleCode: filters.roleCode || undefined,
      aggregatedOnly: filters.aggregatedOnly,
    })
    lastSearchAggregatedOnly.value = filters.aggregatedOnly
  } catch (error: unknown) {
    console.error('Failed to fetch roles:', error)
  } finally {
    loading.value = false
  }
}

// Search
function handleSearch() {
  fetchRoles()
}

// Reset
function handleReset() {
  filters.roleName = ''
  filters.roleCode = undefined
  filters.aggregatedOnly = true
  handleSearch()
}

// Open the detail dialog
function openDetail(id: number) {
  selectedRoleId.value = id
  detailDialog.value = true
}

// Open the form dialog
function openForm(mode: 'create' | 'edit', id?: number) {
  formMode.value = mode
  selectedRoleId.value = id ?? null
  formDialog.value = true
}

// Open the deletion confirmation dialog.
async function openDeleteConfirm(item: RoleListResponseItem) {
  errorMessage.value = ''
  deleteTarget.value = { id: item.id, version: item.version }
  deleteDialog.value = true
}

// Execute deletion
async function handleDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  errorMessage.value = ''
  try {
    await deleteRole(deleteTarget.value)
    deleteDialog.value = false
    deleteTarget.value = null
    fetchRoles()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('role.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}

// Initial Load
fetchRoles()
</script>
