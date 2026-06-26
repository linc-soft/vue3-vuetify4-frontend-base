<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('department.detail.title') }}</v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <template v-else-if="department">
          <v-list>
            <v-list-item :title="t('department.form.deptName')">
              <template #subtitle>{{ department.deptName }}</template>
            </v-list-item>
            <v-list-item :title="t('department.form.deptCode')">
              <template #subtitle>{{ department.deptCode || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('department.form.parent')">
              <template #subtitle>{{ parentLabel }}</template>
            </v-list-item>
            <v-list-item :title="t('department.form.leader')">
              <template #subtitle>{{ leaderLabel }}</template>
            </v-list-item>
            <v-list-item :title="t('department.form.sortOrder')">
              <template #subtitle>{{ department.sortOrder ?? '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('department.form.status')">
              <template #subtitle>{{ commonStatusLabelOf(department.status) }}</template>
            </v-list-item>
          </v-list>
        </template>
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
        <v-btn
          v-perm="'dept:delete'"
          color="error"
          :disabled="loading || !department"
          :prepend-icon="iconOf('dept:delete', '')"
          variant="tonal"
          @click="deleteDialog = true"
        >
          {{ t('department.actions.delete') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('department.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('department.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('department.delete.message') }}</p>
          <v-alert
            v-if="deleteErrorMessage"
            class="mt-3"
            closable
            density="compact"
            type="error"
            variant="tonal"
            @click:close="deleteErrorMessage = ''"
          >
            {{ deleteErrorMessage }}
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
  </v-dialog>
</template>

<script lang="ts" setup>
import type { DepartmentInfoResponse, DepartmentTreeResponse } from '@/api/schemas/department'
import type { UserListResponseItem } from '@/api/schemas/user'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteDepartment, getDepartment, getDepartmentTree } from '@/api/modules/department'
import { getUserList } from '@/api/modules/user'
import { useEnums } from '@/composables/useEnums'
import { useResourceIcon } from '@/composables/useResourceIcon'
import { useSnackbarStore } from '@/stores/snackbar'

const props = defineProps<{
  modelValue: boolean
  departmentId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { iconOf } = useResourceIcon()
const { labelOf: commonStatusLabelOf } = useEnums('common-status')
const snackbar = useSnackbarStore()

const department = ref<DepartmentInfoResponse | null>(null)
const departments = ref<DepartmentTreeResponse[]>([])
const users = ref<UserListResponseItem[]>([])
const loading = ref(false)
const errorMessage = ref('')

const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteErrorMessage = ref('')

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

const parentLabel = computed(() => {
  if (!department.value?.parentId) return '-'
  return deptNameMap.value.get(department.value.parentId) ?? '-'
})

const leaderLabel = computed(() => {
  if (department.value?.leaderUserId == null) return '-'
  const user = users.value.find(u => u.id === department.value!.leaderUserId)
  return user ? `${user.realName || user.username}` : '-'
})

watch(
  () => props.modelValue,
  async open => {
    if (open && props.departmentId != null) {
      loading.value = true
      errorMessage.value = ''
      department.value = null
      try {
        const [detail, deptTree, userList] = await Promise.all([
          getDepartment(props.departmentId),
          getDepartmentTree(),
          getUserList(),
        ])
        department.value = detail
        departments.value = deptTree
        users.value = userList
      } catch (error: unknown) {
        errorMessage.value =
          error instanceof Error ? error.message : t('department.error.loadFailed')
      } finally {
        loading.value = false
      }
    }
  },
)

async function handleDelete() {
  if (!department.value) return
  deleteLoading.value = true
  deleteErrorMessage.value = ''
  try {
    await deleteDepartment({ id: department.value.id, version: department.value.version })
    deleteDialog.value = false
    snackbar.success(t('common.deleteSuccess'))
    emit('deleted')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    deleteErrorMessage.value =
      error instanceof Error ? error.message : t('department.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
