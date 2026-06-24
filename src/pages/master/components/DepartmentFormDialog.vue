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
          autocomplete="off"
          @submit.prevent="handleSubmit"
        >
          <v-text-field
            v-model="form.deptName"
            density="compact"
            :label="t('department.form.deptName')"
            :rules="[rules.deptNameRequired]"
            variant="outlined"
          />
          <v-text-field
            v-model="form.deptCode"
            density="compact"
            :label="t('department.form.deptCode')"
            variant="outlined"
          />
          <!-- <OptionSelect
            v-model="form.parentId"
            clearable
            :label="t('department.form.parent')"
            type="department"
          /> -->
          <v-select
            v-model="form.parentId"
            clearable
            density="compact"
            :hint="t('department.form.parentHint')"
            :items="parentOptions"
            :label="t('department.form.parent')"
            persistent-hint
            variant="outlined"
          />
          <v-text-field
            v-model.number="form.sortOrder"
            density="compact"
            :label="t('department.form.sortOrder')"
            type="number"
            variant="outlined"
          />
          <EnumSelect
            v-model="form.status"
            :label="t('department.form.status')"
            type="common-status"
          />
          <OptionSelect
            v-model="form.leaderUserId"
            clearable
            :label="t('department.form.leader')"
            type="user"
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
          :disabled="loading || confirmDialog"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('department.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="confirmDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('department.form.confirmTitle') }}</v-card-title>
        <v-card-text>
          {{
            mode === 'create'
              ? t('department.form.confirmCreateMessage')
              : t('department.form.confirmEditMessage')
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="submitting"
            variant="text"
            @click="confirmDialog = false"
          >
            {{ t('department.form.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            variant="elevated"
            @click="confirmSubmit"
          >
            {{ t('department.form.confirmYes') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
import EnumSelect from '@/components/EnumSelect.vue'
import OptionSelect from '@/components/OptionSelect.vue'

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
const confirmDialog = ref(false)

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
    if (!open) {
      confirmDialog.value = false
      return
    }
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
  confirmDialog.value = true
}

async function confirmSubmit() {
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
    confirmDialog.value = false
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    confirmDialog.value = false
    errorMessage.value = error instanceof Error ? error.message : t('department.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
