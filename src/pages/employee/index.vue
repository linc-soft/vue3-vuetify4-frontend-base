<template>
  <v-container>
    <v-row
      align="center"
      class="mb-4"
      density="compact"
    >
      <v-col
        cols="12"
        md="3"
      >
        <v-text-field
          v-model="filters.keyword"
          clearable
          density="compact"
          hide-details
          :label="t('employee.search.keyword')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="2"
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
          @click="fetchEmployees"
        >
          {{ t('employee.search.search') }}
        </v-btn>
        <v-btn
          variant="outlined"
          @click="resetFilters"
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

    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      v-model:page="page"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :loading="loading"
      :mobile="mobile"
      @update:options="fetchEmployees"
    >
      <template #item.status="{ value }">
        {{ statusLabelOf(value) }}
      </template>
      <template #item.remainAnnualDays="{ value }">
        <v-chip
          v-if="value != null"
          :color="remainAnnualColor(value)"
          size="small"
          variant="tonal"
        >
          {{ value }} {{ t('employee.detail.days') }}
        </v-chip>
        <span
          v-else
          class="text-medium-emphasis"
        >
          -
        </span>
      </template>
      <template #item.actions="{ item }">
        <v-btn
          density="compact"
          icon="mdi-eye-outline"
          size="small"
          variant="text"
          @click="openDetail(item.id)"
        />
        <v-btn
          density="compact"
          icon="mdi-pencil-outline"
          size="small"
          variant="text"
          @click="openForm('edit', item.id)"
        />
        <v-btn
          color="error"
          density="compact"
          icon="mdi-delete-outline"
          size="small"
          variant="text"
          @click="handleDelete(item)"
        />
      </template>
    </v-data-table-server>

    <EmployeeFormDialog
      v-model="formDialog"
      :employee-id="selectedEmployeeId"
      :mode="formMode"
      @saved="fetchEmployees"
    />
    <EmployeeDetailDialog
      v-model="detailDialog"
      :employee-id="selectedEmployeeId"
      @deleted="fetchEmployees"
    />

    <v-dialog
      v-model="deleteConfirmDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('employee.delete.title') }}</v-card-title>
        <v-card-text>{{ t('employee.delete.message') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="deleteLoading"
            variant="text"
            @click="deleteConfirmDialog = false"
          >
            {{ t('employee.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="confirmDelete"
          >
            {{ t('employee.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import type { EmployeeListResponse } from '@/api/schemas/employee'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { deleteEmployee, getEmployeePage } from '@/api/modules/employee'
import { useUserStatus } from '@/composables/useUserStatus'
import EmployeeDetailDialog from './components/EmployeeDetailDialog.vue'
import EmployeeFormDialog from './components/EmployeeFormDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: statusOptions, labelOf: statusLabelOf } = useUserStatus()

const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const items = ref<EmployeeListResponse[]>([])
const loading = ref(false)

const filters = reactive({
  keyword: '',
  status: '1' as string | undefined,
})

const detailDialog = ref(false)
const formDialog = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const selectedEmployeeId = ref<number | null>(null)
const deleteConfirmDialog = ref(false)
const deleteLoading = ref(false)
const deleteTarget = ref<EmployeeListResponse | null>(null)

const headers = computed(() => [
  { title: t('employee.table.username'), key: 'username' },
  { title: t('employee.table.nickname'), key: 'nickname' },
  { title: t('employee.table.sex'), key: 'sex' },
  { title: t('employee.table.hiredDate'), key: 'hiredDate' },
  { title: t('employee.table.status'), key: 'status' },
  { title: t('employee.table.remainAnnualDays'), key: 'remainAnnualDays' },
  { title: t('employee.table.actions'), key: 'actions', sortable: false },
])

function remainAnnualColor(days: number | null): string {
  if (days == null) return 'grey'
  if (days <= 0) return 'error'
  if (days <= 3) return 'warning'
  return 'success'
}

async function fetchEmployees() {
  loading.value = true
  try {
    const res = await getEmployeePage({
      page: page.value,
      size: itemsPerPage.value,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
    })
    items.value = res.records
    totalItems.value = res.total
  } catch (error: unknown) {
    console.error('Failed to fetch employees:', error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = '1'
  fetchEmployees()
}

function openDetail(id: number) {
  selectedEmployeeId.value = id
  detailDialog.value = true
}

function openForm(mode: 'create' | 'edit', id?: number) {
  formMode.value = mode
  selectedEmployeeId.value = id ?? null
  formDialog.value = true
}

function handleDelete(item: EmployeeListResponse) {
  deleteTarget.value = item
  deleteConfirmDialog.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await deleteEmployee(deleteTarget.value.id)
    deleteConfirmDialog.value = false
    fetchEmployees()
  } catch {
    // error handled by API interceptor
  } finally {
    deleteLoading.value = false
  }
}

onMounted(fetchEmployees)
</script>
