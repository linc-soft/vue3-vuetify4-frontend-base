<template>
  <v-container>
    <!-- Action bar -->
    <v-row
      align="center"
      density="compact"
    >
      <v-col cols="12">
        <v-btn
          class="mr-2"
          variant="outlined"
          @click="fetchTree"
        >
          {{ t('department.actions.refresh') }}
        </v-btn>
        <v-btn
          v-perm="'dept:create'"
          color="primary"
          :prepend-icon="iconOf('dept:create', 'mdi-plus')"
          variant="tonal"
          @click="openForm('create')"
        >
          {{ t('department.actions.create') }}
        </v-btn>
      </v-col>
    </v-row>

    <!-- Department tree -->
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
        v-else-if="tree.length === 0"
        class="text-medium-emphasis pa-6 text-center"
      >
        {{ t('department.empty') }}
      </div>
      <v-treeview
        v-else
        item-title="deptName"
        item-value="id"
        :items="tree"
        open-all
      >
        <template #prepend="{ item }">
          <v-icon
            :color="item.status === '1' ? 'primary' : 'grey'"
            icon="mdi-office-building-outline"
          />
        </template>
        <template #append="{ item }">
          <span
            v-if="item.deptCode"
            class="text-disabled text-caption mr-2"
          >
            {{ item.deptCode }}
          </span>
          <v-chip
            v-if="item.status !== '1'"
            class="mr-2"
            color="grey"
            size="x-small"
            variant="tonal"
          >
            {{ commonStatusLabelOf(item.status) }}
          </v-chip>
          <v-btn
            v-perm="'dept:create'"
            density="compact"
            :icon="iconOf('dept:create', 'mdi-plus')"
            size="small"
            :title="t('department.actions.addChild')"
            variant="text"
            @click.stop="openChild(item.id)"
          />
          <v-btn
            v-perm="'dept:view'"
            density="compact"
            :icon="iconOf('dept:view', 'mdi-eye-outline')"
            size="small"
            :title="t('department.actions.detail')"
            variant="text"
            @click.stop="openDetail(item.id)"
          />
          <v-btn
            v-perm="'dept:update'"
            density="compact"
            :icon="iconOf('dept:update', 'mdi-pencil-outline')"
            size="small"
            :title="t('department.actions.edit')"
            variant="text"
            @click.stop="openForm('edit', item.id)"
          />
          <v-btn
            v-perm="'dept:delete'"
            color="error"
            density="compact"
            :icon="iconOf('dept:delete', 'mdi-delete-outline')"
            size="small"
            :title="t('department.actions.delete')"
            variant="text"
            @click.stop="openDeleteConfirm(item)"
          />
        </template>
      </v-treeview>
    </v-card>

    <!-- Department Form Dialog -->
    <DepartmentFormDialog
      v-model="formDialog"
      :department-id="selectedId"
      :mode="formMode"
      :preset-parent-id="presetParentId"
      @saved="fetchTree"
    />

    <!-- Department Detail Dialog -->
    <DepartmentDetailDialog
      v-model="detailDialog"
      :department-id="selectedDetailId"
      @deleted="fetchTree"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('department.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('department.delete.message') }}</p>
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
            {{ t('department.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('department.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import type { DepartmentTreeResponse } from '@/api/schemas/department'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteDepartment, getDepartmentTree } from '@/api/modules/department'
import { useEnums } from '@/composables/useEnums'
import { useResourceIcon } from '@/composables/useResourceIcon'
import DepartmentDetailDialog from './components/DepartmentDetailDialog.vue'
import DepartmentFormDialog from './components/DepartmentFormDialog.vue'

const { t } = useI18n()
const { mobile } = useDisplay()
const { iconOf } = useResourceIcon()
const { labelOf: commonStatusLabelOf } = useEnums('common-status')

const tree = ref<DepartmentTreeResponse[]>([])
const loading = ref(false)

const formDialog = ref(false)
const selectedId = ref<number | null>(null)
const formMode = ref<'create' | 'edit'>('create')
const presetParentId = ref<number | null>(null)

const detailDialog = ref(false)
const selectedDetailId = ref<number | null>(null)

const deleteDialog = ref(false)
const deleteTarget = ref<{ id: number; version: number } | null>(null)
const deleteLoading = ref(false)
const errorMessage = ref('')

async function fetchTree() {
  loading.value = true
  try {
    tree.value = await getDepartmentTree()
  } catch (error: unknown) {
    console.error('Failed to fetch department tree:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTree()
})

function openForm(mode: 'create' | 'edit', id?: number) {
  formMode.value = mode
  selectedId.value = id ?? null
  presetParentId.value = null
  formDialog.value = true
}

function openDetail(id: number) {
  selectedDetailId.value = id
  detailDialog.value = true
}

function openChild(parentId: number) {
  formMode.value = 'create'
  selectedId.value = null
  presetParentId.value = parentId
  formDialog.value = true
}

function openDeleteConfirm(item: DepartmentTreeResponse) {
  errorMessage.value = ''
  deleteTarget.value = { id: item.id, version: item.version }
  deleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  errorMessage.value = ''
  try {
    await deleteDepartment(deleteTarget.value)
    deleteDialog.value = false
    deleteTarget.value = null
    fetchTree()
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('department.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
