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
          v-model="filters.realName"
          clearable
          density="compact"
          hide-details
          :label="t('employee.search.realName')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-text-field
          v-model="filters.employeeNo"
          clearable
          density="compact"
          hide-details
          :label="t('employee.search.employeeNo')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <v-select
          v-model="filters.deptId"
          clearable
          density="compact"
          hide-details
          :items="deptOptions"
          :label="t('employee.search.dept')"
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
          :label="t('employee.search.status')"
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
          {{ t('employee.search.search') }}
        </v-btn>
        <v-btn
          class="mr-2"
          variant="outlined"
          @click="handleReset"
        >
          {{ t('employee.search.reset') }}
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          variant="tonal"
          @click="openForm('create')"
        >
          {{ t('employee.actions.create') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Paginated data table -->
    <v-data-table-server
      class="mt-4"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :mobile="mobile"
      :page="page"
      :sort-by="sortBy"
      @update:options="onOptionsUpdate"
    >
      <template #item.deptId="{ value }">
        {{ value != null ? (deptNameMap.get(value) ?? '-') : '-' }}
      </template>
      <template #item.positionId="{ value }">
        {{ value != null ? (positionNameMap.get(value) ?? '-') : '-' }}
      </template>
      <template #item.status="{ value }">
        {{ statusLabelOf(value) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          density="compact"
          icon="mdi-eye-outline"
          size="small"
          :title="t('employee.actions.detail')"
          variant="text"
          @click="openDetail(item.id)"
        />
        <v-btn
          density="compact"
          icon="mdi-pencil-outline"
          size="small"
          :title="t('employee.actions.edit')"
          variant="text"
          @click="openForm('edit', item.id)"
        />
        <v-btn
          color="error"
          density="compact"
          icon="mdi-delete-outline"
          size="small"
          :title="t('employee.actions.delete')"
          variant="text"
          @click="openDeleteConfirm(item)"
        />
      </template>
    </v-data-table-server>

    <!-- Employee Detail Dialog -->
    <EmployeeDetailDialog
      v-model="detailDialog"
      :employee-id="selectedId"
    />

    <!-- Employee Form Dialog -->
    <EmployeeFormDialog
      v-model="formDialog"
      :employee-id="selectedId"
      :mode="formMode"
      @saved="fetchEmployees"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('employee.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('employee.delete.message') }}</p>
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
            {{ t('employee.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('employee.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import type { DepartmentTreeResponse } from '@/api/schemas/department'
import type { EmployeePageResponseItem } from '@/api/schemas/employee'
import type { PositionInfoResponse } from '@/api/schemas/position'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getDepartmentTree } from '@/api/modules/department'
import { deleteEmployee, getEmployeePage } from '@/api/modules/employee'
import { getPositionList } from '@/api/modules/position'
import { useEmployeeStatus } from '@/composables/useCommonStatus'
import EmployeeDetailDialog from './components/EmployeeDetailDialog.vue'
import EmployeeFormDialog from './components/EmployeeFormDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: statusOptions, labelOf: statusLabelOf } = useEmployeeStatus()

const filters = reactive<{
  realName: string
  employeeNo: string
  deptId: number | null
  status: string
}>({
  realName: '',
  employeeNo: '',
  deptId: null,
  status: '',
})

const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([])

const items = ref<EmployeePageResponseItem[]>([])
const loading = ref(false)

const detailDialog = ref(false)
const formDialog = ref(false)
const selectedId = ref<number | null>(null)
const formMode = ref<'create' | 'edit'>('create')

const deleteDialog = ref(false)
const deleteTarget = ref<{ id: number; version: number } | null>(null)
const deleteLoading = ref(false)
const errorMessage = ref('')

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

const deptOptions = computed(() => {
  const result: { title: string; value: number }[] = []
  const walk = (nodes: DepartmentTreeResponse[], depth: number) => {
    for (const node of nodes) {
      result.push({ title: `${'　'.repeat(depth)}${node.deptName}`, value: node.id })
      if (node.children?.length) walk(node.children, depth + 1)
    }
  }
  walk(departments.value, 0)
  return result
})

// Sort field mapping (frontend key → backend column name)
const sortFieldMap: Record<string, string> = {
  realName: 'real_name',
  employeeNo: 'employee_no',
  hireDate: 'hire_date',
  status: 'status',
}

const headers = computed(() => [
  { title: t('employee.table.realName'), key: 'realName' },
  { title: t('employee.table.employeeNo'), key: 'employeeNo' },
  { title: t('employee.table.dept'), key: 'deptId', sortable: false },
  { title: t('employee.table.position'), key: 'positionId', sortable: false },
  { title: t('employee.table.mobile'), key: 'mobile', sortable: false },
  { title: t('employee.table.email'), key: 'email', sortable: false },
  { title: t('employee.table.hireDate'), key: 'hireDate' },
  { title: t('employee.table.status'), key: 'status' },
  {
    title: t('employee.table.actions'),
    key: 'actions',
    sortable: false,
    cellClass: 'column-actions',
  },
])

onMounted(async () => {
  try {
    const [deptTree, positionList] = await Promise.all([getDepartmentTree(), getPositionList()])
    departments.value = deptTree
    positions.value = positionList
  } catch (error: unknown) {
    console.error('Failed to load reference data:', error)
  }
})

async function fetchEmployees() {
  loading.value = true
  try {
    const res = await getEmployeePage({
      page: page.value,
      size: itemsPerPage.value,
      realName: filters.realName || undefined,
      employeeNo: filters.employeeNo || undefined,
      deptId: filters.deptId ?? undefined,
      status: filters.status || undefined,
      sortBy:
        sortBy.value.length > 0
          ? sortBy.value.map(s => sortFieldMap[s.key] ?? s.key).join(',')
          : undefined,
      sortOrder: sortBy.value.length > 0 ? sortBy.value.map(s => s.order).join(',') : undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch employees:', error)
  } finally {
    loading.value = false
  }
}

function onOptionsUpdate(options: {
  page: number
  itemsPerPage: number
  sortBy: { key: string; order: 'asc' | 'desc' }[]
}) {
  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy ?? []
  fetchEmployees()
}

function handleSearch() {
  page.value = 1
  fetchEmployees()
}

function handleReset() {
  filters.realName = ''
  filters.employeeNo = ''
  filters.deptId = null
  filters.status = ''
  sortBy.value = []
  handleSearch()
}

function openDetail(id: number) {
  selectedId.value = id
  detailDialog.value = true
}

function openForm(mode: 'create' | 'edit', id?: number) {
  formMode.value = mode
  selectedId.value = id ?? null
  formDialog.value = true
}

function openDeleteConfirm(item: EmployeePageResponseItem) {
  errorMessage.value = ''
  deleteTarget.value = { id: item.id, version: item.version }
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  errorMessage.value = ''
  try {
    await deleteEmployee(deleteTarget.value)
    deleteDialog.value = false
    deleteTarget.value = null
    fetchEmployees()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('employee.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
