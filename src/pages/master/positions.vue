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
          v-model="filters.positionName"
          clearable
          density="compact"
          hide-details
          :label="t('position.search.positionName')"
          variant="outlined"
        />
      </v-col>
      <v-col
        cols="12"
        md="3"
      >
        <EnumSelect
          v-model="filters.status"
          clearable
          hide-details
          :label="t('position.search.status')"
          type="common-status"
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
          {{ t('position.search.search') }}
        </v-btn>
        <v-btn
          class="mr-2"
          variant="outlined"
          @click="handleReset"
        >
          {{ t('position.search.reset') }}
        </v-btn>
        <v-btn
          v-perm="'position:create'"
          color="primary"
          :prepend-icon="iconOf('position:create', 'mdi-plus')"
          variant="tonal"
          @click="openForm('create')"
        >
          {{ t('position.actions.create') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Data table -->
    <v-data-table
      class="mt-4"
      :headers="allHeaders"
      :items="items"
      :loading="loading"
      :mobile="mobile"
      multi-sort
    >
      <template #item.status="{ value }">
        {{ commonStatusLabelOf(value) }}
      </template>
      <template #item.actions="{ item }">
        <v-btn
          v-perm="'position:view'"
          density="compact"
          :icon="iconOf('position:view', 'mdi-eye-outline')"
          size="small"
          :title="t('position.actions.detail')"
          variant="text"
          @click="openDetail(item.id)"
        />
        <v-btn
          v-perm="'position:update'"
          density="compact"
          :icon="iconOf('position:update', 'mdi-pencil-outline')"
          size="small"
          :title="t('position.actions.edit')"
          variant="text"
          @click="openForm('edit', item.id)"
        />
        <v-btn
          v-perm="'position:delete'"
          color="error"
          density="compact"
          :icon="iconOf('position:delete', 'mdi-delete-outline')"
          size="small"
          :title="t('position.actions.delete')"
          variant="text"
          @click="openDeleteConfirm(item)"
        />
      </template>
    </v-data-table>

    <!-- Position Form Dialog -->
    <PositionFormDialog
      v-model="formDialog"
      :mode="formMode"
      :position-id="selectedId"
      @saved="fetchPositions"
    />

    <!-- Position Detail Dialog -->
    <PositionDetailDialog
      v-model="detailDialog"
      :position-id="selectedDetailId"
      @deleted="fetchPositions"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('position.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('position.delete.message') }}</p>
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
            {{ t('position.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('position.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import type { PositionInfoResponse } from '@/api/schemas/position'
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deletePosition, getPositionList } from '@/api/modules/position'
import EnumSelect from '@/components/EnumSelect.vue'
import { useEnums } from '@/composables/useEnums'
import { useResourceIcon } from '@/composables/useResourceIcon'
import { useSnackbarStore } from '@/stores/snackbar'
import PositionDetailDialog from './components/PositionDetailDialog.vue'
import PositionFormDialog from './components/PositionFormDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { iconOf } = useResourceIcon()
const snackbar = useSnackbarStore()

const filters = reactive({ positionName: '', status: '' })

const items = ref<PositionInfoResponse[]>([])
const loading = ref(false)

const formDialog = ref(false)
const selectedId = ref<number | null>(null)
const formMode = ref<'create' | 'edit'>('create')

const detailDialog = ref(false)
const selectedDetailId = ref<number | null>(null)

const deleteDialog = ref(false)
const deleteTarget = ref<{ id: number; version: number } | null>(null)
const deleteLoading = ref(false)
const errorMessage = ref('')

const { labelOf: commonStatusLabelOf } = useEnums('common-status')

const allHeaders = computed(() => [
  { title: t('position.table.positionName'), key: 'positionName' },
  { title: t('position.table.positionCode'), key: 'positionCode' },
  { title: t('position.table.sortOrder'), key: 'sortOrder' },
  { title: t('position.table.status'), key: 'status' },
  {
    title: t('position.table.actions'),
    key: 'actions',
    sortable: false,
    cellClass: 'column-actions',
  },
])

async function fetchPositions() {
  loading.value = true
  try {
    items.value = await getPositionList({
      positionName: filters.positionName || undefined,
      status: filters.status ?? undefined,
    })
  } catch (error: unknown) {
    console.error('Failed to fetch positions:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPositions()
})

function handleSearch() {
  fetchPositions()
}

function handleReset() {
  filters.positionName = ''
  filters.status = ''
  fetchPositions()
}

function openForm(mode: 'create' | 'edit', id?: number) {
  formMode.value = mode
  selectedId.value = id ?? null
  formDialog.value = true
}

function openDetail(id: number) {
  selectedDetailId.value = id
  detailDialog.value = true
}

function openDeleteConfirm(item: PositionInfoResponse) {
  errorMessage.value = ''
  deleteTarget.value = { id: item.id, version: item.version }
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  errorMessage.value = ''
  try {
    await deletePosition(deleteTarget.value)
    deleteDialog.value = false
    deleteTarget.value = null
    snackbar.success(t('common.deleteSuccess'))
    fetchPositions()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('position.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
