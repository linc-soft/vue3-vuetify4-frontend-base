<template>
  <v-container>
    <!-- Search and filter area -->
    <v-row
      align="center"
      density="compact"
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
        <v-btn
          prepend-icon="mdi-file-pdf-box"
          variant="tonal"
          @click="reportDialog = true"
        >
          {{ t('user.report.button') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Data table with client-side pagination -->
    <v-data-table
      class="mt-4"
      :headers="allHeaders"
      :items="items"
      :loading="loading"
      :mobile="mobile"
      multi-sort
    >
      <template #item.realName="{ value }">
        {{ value ?? '-' }}
      </template>
      <template #item.deptId="{ value }">
        {{ value != null ? (deptNameMap.get(value) ?? '-') : '-' }}
      </template>
      <template #item.positionId="{ value }">
        {{ value != null ? (positionNameMap.get(value) ?? '-') : '-' }}
      </template>
      <template #item.gender="{ value }">
        {{ value != null ? genderLabelOf(value) : '-' }}
      </template>
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
    </v-data-table>

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

    <!-- Report Dialog -->
    <v-dialog
      v-model="reportDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('user.report.title') }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="reportGroupBy"
            :items="reportGroupByOptions"
            :label="t('user.report.groupBy')"
            variant="outlined"
          />
          <v-alert
            v-if="reportError"
            class="mt-3"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="reportError = ''"
          >
            {{ reportError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="reportDialog = false"
          >
            {{ t('user.report.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="reportLoading"
            variant="elevated"
            @click="handleGenerateReport"
          >
            {{ t('user.report.generate') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
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
import type { DepartmentTreeResponse } from '@/api/schemas/department'
import type { PositionInfoResponse } from '@/api/schemas/position'
import type { UserListResponseItem } from '@/api/schemas/user'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getDepartmentTree } from '@/api/modules/department'
import { getPositionList } from '@/api/modules/position'
import { deleteUser, generateUserReport, getUserList } from '@/api/modules/user'
import { useEnums } from '@/composables/useEnums'
import UserDetailDialog from './components/UserDetailDialog.vue'
import UserFormDialog from './components/UserFormDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()

// Filter Conditions
const filters = reactive({ username: '', status: '1' })

// Table data and loading state
const items = ref<UserListResponseItem[]>([])
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

// Report related
const reportDialog = ref(false)
const reportGroupBy = ref<string | null>(null)
const reportLoading = ref(false)
const reportError = ref('')

const reportGroupByOptions = computed(() => [
  { title: t('user.report.groupByNone'), value: '' },
  { title: t('user.report.groupByAggregateRole'), value: 'aggregateRole' },
  { title: t('user.report.groupByBaseRole'), value: 'baseRole' },
])

// Status options (client-side i18n mapping)
const { options: statusOptions, labelOf: statusLabelOf } = useEnums('user-status')
const { labelOf: genderLabelOf } = useEnums('gender')

// Reference data for resolving dept / position display names.
const departments = ref<DepartmentTreeResponse[]>([])
const positions = ref<PositionInfoResponse[]>([])

const deptNameMap = computed(() => {
  const map = new Map<number, string>()
  const walk = (nodes: DepartmentTreeResponse[]) => {
    for (const node of nodes) {
      map.set(node.id, node.deptName)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(departments.value)
  return map
})

const positionNameMap = computed(
  () => new Map<number, string>(positions.value.map(p => [p.id, p.positionName])),
)

// Table column definitions
const allHeaders = computed(() => [
  { title: t('user.table.realName'), key: 'realName' },
  { title: t('user.table.dept'), key: 'deptId', sortable: false },
  { title: t('user.table.position'), key: 'positionId', sortable: false },
  { title: t('user.table.mobile'), key: 'mobile', sortable: false },
  { title: t('user.table.gender'), key: 'gender', sortable: false },
  { title: t('user.table.birthday'), key: 'birthday', sortable: false },
  { title: t('user.table.status'), key: 'status' },
  { title: t('user.table.actions'), key: 'actions', sortable: false, cellClass: 'column-actions' },
])

// Fetch data
async function fetchUsers() {
  loading.value = true
  try {
    items.value = await getUserList({
      username: filters.username || undefined,
      status: filters.status || undefined,
    })
  } catch (error: unknown) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const [deptTree, positionList] = await Promise.all([getDepartmentTree(), getPositionList()])
    departments.value = deptTree
    positions.value = positionList
  } catch (error: unknown) {
    console.error('Failed to load reference data:', error)
  }
  fetchUsers()
})

// Search
function handleSearch() {
  fetchUsers()
}

// Reset
function handleReset() {
  filters.username = ''
  filters.status = '1'
  fetchUsers()
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
async function openDeleteConfirm(item: UserListResponseItem) {
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

async function handleGenerateReport() {
  reportLoading.value = true
  reportError.value = ''
  try {
    const blob = await generateUserReport({
      username: filters.username || undefined,
      groupBy: reportGroupBy.value || undefined,
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user_report_${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    reportDialog.value = false
  } catch (error: unknown) {
    reportError.value = error instanceof Error ? error.message : t('user.error.loadFailed')
  } finally {
    reportLoading.value = false
  }
}
</script>
