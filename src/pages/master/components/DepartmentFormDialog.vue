<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>
        {{ mode === 'create' ? t('department.form.createTitle') : t('department.form.editTitle') }}
      </v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <v-form
          v-else
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <v-text-field
            v-model="form.deptName"
            :label="t('department.form.deptName')"
            :rules="[rules.deptNameRequired]"
          />
          <v-text-field
            v-model="form.deptCode"
            :label="t('department.form.deptCode')"
          />
          <v-select
            v-model="form.parentId"
            clearable
            :hint="t('department.form.parentHint')"
            :items="parentOptions"
            :label="t('department.form.parent')"
            persistent-hint
          />
          <v-text-field
            v-model.number="form.sortOrder"
            :label="t('department.form.sortOrder')"
            type="number"
          />
          <v-select
            v-model="form.status"
            :items="statusOptions"
            :label="t('department.form.status')"
          />
          <UserAutocomplete
            v-model="form.leaderUserId"
            clearable
            :label="t('department.form.leader')"
            value-key="id"
          />
        </v-form>
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
          :disabled="submitting"
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('department.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('department.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { DepartmentTreeResponse } from '@/api/schemas/department'
import type { VForm } from 'vuetify/components'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import {
  createDepartment,
  getDepartment,
  getDepartmentTree,
  updateDepartment,
} from '@/api/modules/department'
import UserAutocomplete from '@/components/UserAutocomplete.vue'
import { useEnums } from '@/composables/useEnums'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  departmentId: number | null
  // Preselected parent when creating a child under a specific node.
  presetParentId?: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: statusOptions } = useEnums('common-status')

const form = reactive<{
  deptName: string
  deptCode: string
  parentId: number | null
  leaderUserId: number | null
  sortOrder: number | null
  status: string
}>({
  deptName: '',
  deptCode: '',
  parentId: null,
  leaderUserId: null,
  sortOrder: 0,
  status: '1',
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const tree = ref<DepartmentTreeResponse[]>([])

// Flatten the tree into indented select options, excluding the node being
// edited and its descendants to prevent creating a cycle.
const parentOptions = computed(() => {
  const result: { title: string; value: number }[] = []
  const excludeId = props.mode === 'edit' ? props.departmentId : null

  const walk = (nodes: DepartmentTreeResponse[], depth: number, blocked: boolean) => {
    for (const node of nodes) {
      const isExcluded = blocked || node.id === excludeId
      if (!isExcluded) {
        result.push({ title: `${'　'.repeat(depth)}${node.deptName}`, value: node.id })
      }
      if (node.children?.length) {
        walk(node.children, depth + 1, isExcluded)
      }
    }
  }
  walk(tree.value, 0, false)
  return result
})

const rules = {
  deptNameRequired: (v: string) => !!v || t('department.validation.deptNameRequired'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) return
    errorMessage.value = ''
    loading.value = true
    try {
      const [treeData, dept] = await Promise.all([
        getDepartmentTree(),
        props.mode === 'edit' && props.departmentId != null
          ? getDepartment(props.departmentId)
          : Promise.resolve(null),
      ])
      tree.value = treeData

      if (props.mode === 'create') {
        form.deptName = ''
        form.deptCode = ''
        form.parentId = props.presetParentId ?? null
        form.leaderUserId = null
        form.sortOrder = 0
        form.status = '1'
        version.value = 0
        formRef.value?.resetValidation()
      } else if (dept) {
        form.deptName = dept.deptName
        form.deptCode = dept.deptCode ?? ''
        form.parentId = dept.parentId && dept.parentId !== 0 ? dept.parentId : null
        form.leaderUserId = dept.leaderUserId ?? null
        form.sortOrder = dept.sortOrder ?? 0
        form.status = dept.status
        version.value = dept.version
      }
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('department.error.loadFailed')
    } finally {
      loading.value = false
    }
  },
)

async function handleSubmit() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  submitting.value = true
  errorMessage.value = ''
  try {
    await (props.mode === 'create'
      ? createDepartment({
          deptName: form.deptName,
          deptCode: form.deptCode || undefined,
          parentId: form.parentId ?? 0,
          leaderUserId: form.leaderUserId ?? undefined,
          sortOrder: form.sortOrder ?? undefined,
          status: form.status || undefined,
        })
      : updateDepartment({
          id: props.departmentId!,
          deptName: form.deptName,
          deptCode: form.deptCode || undefined,
          parentId: form.parentId ?? 0,
          leaderUserId: form.leaderUserId ?? undefined,
          sortOrder: form.sortOrder ?? undefined,
          status: form.status || undefined,
          version: version.value,
        }))
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('department.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
