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
  </v-container>
</template>

<script lang="ts" setup>
import type { EmployeeListResponse } from '@/api/schemas/employee'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { deleteEmployee, getEmployeePage } from '@/api/modules/employee'
import { useUserStatus } from '@/composables/useUserStatus'

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

const headers = computed(() => [
  { title: t('employee.table.username'), key: 'username' },
  { title: t('employee.table.nickname'), key: 'nickname' },
  { title: t('employee.table.sex'), key: 'sex' },
  { title: t('employee.table.hiredDate'), key: 'hiredDate' },
  { title: t('employee.table.status'), key: 'status' },
  { title: t('employee.table.actions'), key: 'actions', sortable: false },
])

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
  // TODO: navigate to detail
}

function openForm(mode: 'create' | 'edit', id?: number) {
  // TODO: navigate to form
}

async function handleDelete(item: EmployeeListResponse) {
  // TODO: confirm and delete
}
</script>
