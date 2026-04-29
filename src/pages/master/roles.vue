<template>
  <v-container>
    <!-- Search and Filter Section -->
    <v-row
      align="center"
      dense
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
        <v-text-field
          v-model="filters.roleCode"
          clearable
          density="compact"
          hide-details
          :label="t('role.search.roleCode')"
          variant="outlined"
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
      :headers="visibleHeaders"
      :items="items"
      :items-per-page="itemsPerPage"
      :loading="loading"
      @update:items-per-page="itemsPerPage = $event"
    >
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
          density="compact"
          icon="mdi-pencil-outline"
          size="small"
          :title="t('role.actions.edit')"
          variant="text"
          @click="openForm('edit', item.id)"
        />
        <v-btn
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
      max-width="400"
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

import { deleteRole, getRole, getRoleList } from '@/api/modules/role'
import RoleDetailDialog from './components/RoleDetailDialog.vue'
import RoleFormDialog from './components/RoleFormDialog.vue'

const { t } = useI18n()
const { smAndDown } = useDisplay()

// Filter Conditions
const filters = reactive({ roleName: '', roleCode: '' })

// Table data and loading state
const items = ref<RoleListResponseItem[]>([])
const loading = ref(false)
const itemsPerPage = ref(10)

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

// table column definitions
const allHeaders = computed(() => [
  { title: t('role.table.roleName'), key: 'roleName' },
  { title: t('role.table.roleCode'), key: 'roleCode' },
  { title: t('role.table.description'), key: 'description' },
  { title: t('role.table.updateBy'), key: 'updateBy' },
  { title: t('role.table.updateAt'), key: 'updateAt' },
  { title: t('role.table.actions'), key: 'actions', sortable: false },
])

const visibleHeaders = computed(() => {
  if (smAndDown.value) {
    return allHeaders.value.filter(
      h => h.key !== 'description' && h.key !== 'updateBy' && h.key !== 'updateAt',
    )
  }
  return allHeaders.value
})

// Get role list
async function fetchRoles() {
  loading.value = true
  try {
    items.value = await getRoleList({
      roleName: filters.roleName || undefined,
      roleCode: filters.roleCode || undefined,
    })
    console.log(items.value)
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
  filters.roleCode = ''
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
  deleteLoading.value = true
  deleteDialog.value = true
  try {
    const roleInfo = await getRole(item.id)
    deleteTarget.value = { id: roleInfo.id, version: roleInfo.version }
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('role.error.loadFailed')
  } finally {
    deleteLoading.value = false
  }
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
