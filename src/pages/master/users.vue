<template>
  <v-container>
    <!-- Search and filter area -->
    <v-row
      align="center"
      dense
    >
      <v-col
        cols="12"
        md="3"
      >
        <v-text-field
          v-model="filters.username"
          clearable
          density="compact"
          hide-details
          :label="t('user.search.username')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-select
          v-model="filters.status"
          clearable
          density="compact"
          hide-details
          :items="statusOptions"
          :label="t('user.search.status')"
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
          {{ t('user.search.search') }}
        </v-btn>
        <v-btn
          class="mr-2"
          variant="outlined"
          @click="handleReset"
        >
          {{ t('user.search.reset') }}
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          variant="tonal"
          @click="openForm('create')"
        >
          {{ t('user.actions.create') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Paginated data table -->
    <v-data-table-server
      class="mt-4"
      :headers="visibleHeaders"
      :items="items"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :page="page"
      @update:options="onOptionsUpdate"
    >
      <template #item.status="{ value }">
        {{ statusLabelOf(value) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          density="compact"
          icon="mdi-eye-outline"
          size="small"
          :title="t('user.actions.detail')"
          variant="text"
          @click="openDetail(item.id)"
        />
        <v-btn
          density="compact"
          icon="mdi-pencil-outline"
          size="small"
          :title="t('user.actions.edit')"
          variant="text"
          @click="openForm('edit', item.id)"
        />
        <v-btn
          color="error"
          density="compact"
          icon="mdi-delete-outline"
          size="small"
          :title="t('user.actions.delete')"
          variant="text"
          @click="openDeleteConfirm(item)"
        />
      </template>
    </v-data-table-server>

    <!-- User Details Dialog -->
    <UserDetailDialog
      v-model="detailDialog"
      :user-id="selectedUserId"
      @deleted="fetchUsers"
    />

    <!-- User Form Dialog -->
    <UserFormDialog
      v-model="formDialog"
      :mode="formMode"
      :user-id="selectedUserId"
      @saved="fetchUsers"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('user.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('user.delete.message') }}</p>
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
            {{ t('user.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('user.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import type { UserPageResponseItem } from '@/api/schemas/user'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteUser, getUserPage } from '@/api/modules/user'
import { useEnums } from '@/composables/useEnums'
import UserDetailDialog from './components/UserDetailDialog.vue'
import UserFormDialog from './components/UserFormDialog.vue'

const { t } = useI18n()
const { smAndDown } = useDisplay()

// Filter Conditions
const filters = reactive({ username: '', status: '' as string | undefined })

// Pagination parameters
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)

// Table data and loading state
const items = ref<UserPageResponseItem[]>([])
const loading = ref(false)

// Dialog control
const detailDialog = ref(false)
const formDialog = ref(false)
const selectedUserId = ref<number | null>(null)
const formMode = ref<'create' | 'edit'>('create')

// Deletion related
const deleteDialog = ref(false)
const deleteTarget = ref<{ id: number; version: number } | null>(null)
const deleteLoading = ref(false)
const errorMessage = ref('')

// Status options (from backend enums)
const { options: statusOptions, labelOf: statusLabelOf } = useEnums('user-status')

// Table column definitions
const allHeaders = computed(() => [
  { title: t('user.table.username'), key: 'username' },
  { title: t('user.table.status'), key: 'status' },
  { title: t('user.table.updateBy'), key: 'updateBy' },
  { title: t('user.table.updateAt'), key: 'updateAt' },
  { title: t('user.table.actions'), key: 'actions', sortable: false },
])

const visibleHeaders = computed(() => {
  if (smAndDown.value) {
    return allHeaders.value.filter(h => h.key !== 'updateBy' && h.key !== 'updateAt')
  }
  return allHeaders.value
})

// Fetch paginated data
async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUserPage({
      page: page.value,
      size: itemsPerPage.value,
      username: filters.username || undefined,
      status: filters.status || undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

// Handle pagination option changes
function onOptionsUpdate(options: { page: number; itemsPerPage: number }) {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  fetchUsers()
}

// Search
function handleSearch() {
  page.value = 1
  fetchUsers()
}

// Reset
function handleReset() {
  filters.username = ''
  filters.status = undefined
  handleSearch()
}

// Open the details dialog
function openDetail(id: number) {
  selectedUserId.value = id
  detailDialog.value = true
}

// Open the form dialog
function openForm(mode: 'create' | 'edit', id?: number) {
  formMode.value = mode
  selectedUserId.value = id ?? null
  formDialog.value = true
}

// Open the delete confirmation box
async function openDeleteConfirm(item: UserPageResponseItem) {
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
    await deleteUser(deleteTarget.value)
    deleteDialog.value = false
    deleteTarget.value = null
    fetchUsers()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('user.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
