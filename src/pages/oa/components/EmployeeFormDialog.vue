<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 720"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>
        {{ mode === 'create' ? t('employee.form.createTitle') : t('employee.form.editTitle') }}
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
          <v-row density="comfortable">
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.realName"
                :label="t('employee.form.realName')"
                :rules="[rules.realNameRequired]"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.employeeNo"
                :label="t('employee.form.employeeNo')"
              />
            </v-col>
            <v-col
              v-if="mode === 'create'"
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.username"
                :hint="t('employee.form.usernameHint')"
                :label="t('employee.form.username')"
                persistent-hint
                :rules="[rules.usernameRequired, rules.usernamePattern]"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.email"
                :hint="mode === 'create' ? t('employee.form.emailHint') : undefined"
                :label="t('employee.form.email')"
                :persistent-hint="mode === 'create'"
                :rules="
                  mode === 'create'
                    ? [rules.emailRequired, rules.emailPattern]
                    : [rules.emailPattern]
                "
                type="email"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="form.deptId"
                clearable
                :items="deptOptions"
                :label="t('employee.form.dept')"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="form.positionId"
                clearable
                :items="positionOptions"
                :label="t('employee.form.position')"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="form.managerId"
                clearable
                :items="managerOptions"
                :label="t('employee.form.manager')"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.mobile"
                :label="t('employee.form.mobile')"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="form.gender"
                clearable
                :items="genderOptions"
                :label="t('employee.form.gender')"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.idCardNo"
                :label="t('employee.form.idCardNo')"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.birthday"
                :label="t('employee.form.birthday')"
                type="date"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="form.hireDate"
                :label="t('employee.form.hireDate')"
                type="date"
              />
            </v-col>
            <v-col
              v-if="mode === 'edit'"
              cols="12"
              md="6"
            >
              <v-select
                v-model="form.status"
                :items="statusOptions"
                :label="t('employee.form.status')"
              />
            </v-col>
            <v-col
              v-if="mode === 'create'"
              cols="12"
            >
              <v-autocomplete
                v-model="form.roleIds"
                chips
                clearable
                closable-chips
                :hint="t('employee.form.rolesHint')"
                :items="roleOptions"
                :label="t('employee.form.roles')"
                multiple
                persistent-hint
                variant="outlined"
              />
            </v-col>
          </v-row>
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
          {{ t('employee.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('employee.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { DepartmentTreeResponse } from '@/api/schemas/department'
import type { EmployeePageResponseItem } from '@/api/schemas/employee'
import type { PositionInfoResponse } from '@/api/schemas/position'
import type { VForm } from 'vuetify/components'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getDepartmentTree } from '@/api/modules/department'
import {
  createEmployee,
  getEmployee,
  getEmployeePage,
  updateEmployee,
} from '@/api/modules/employee'
import { getPositionList } from '@/api/modules/position'
import { useEmployeeStatus, useGender } from '@/composables/useCommonStatus'
import { useSelectOptions } from '@/composables/useSelectOptions'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  employeeId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { options: statusOptions } = useEmployeeStatus()
const { options: genderOptions } = useGender()
const { items: roleItems } = useSelectOptions('role')

const form = reactive<{
  username: string
  employeeNo: string
  realName: string
  deptId: number | null
  positionId: number | null
  managerId: number | null
  mobile: string
  email: string
  gender: string | null
  idCardNo: string
  birthday: string
  hireDate: string
  status: string
  roleIds: number[]
}>({
  username: '',
  employeeNo: '',
  realName: '',
  deptId: null,
  positionId: null,
  managerId: null,
  mobile: '',
  email: '',
  gender: null,
  idCardNo: '',
  birthday: '',
  hireDate: '',
  status: '1',
  roleIds: [],
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const departments = ref<DepartmentTreeResponse[]>([])
const positions = ref<PositionInfoResponse[]>([])
const managers = ref<EmployeePageResponseItem[]>([])

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

const positionOptions = computed(() =>
  positions.value.map(p => ({ title: p.positionName, value: p.id })),
)

const managerOptions = computed(() =>
  managers.value
    .filter(m => m.id !== props.employeeId)
    .map(m => ({
      title: m.employeeNo ? `${m.realName} (${m.employeeNo})` : m.realName,
      value: m.id,
    })),
)

const roleOptions = computed(() =>
  roleItems.value.map(item => ({ title: item.label, value: item.value })),
)

const rules = {
  realNameRequired: (v: string) => !!v || t('employee.validation.realNameRequired'),
  usernameRequired: (v: string) => !!v || t('employee.validation.usernameRequired'),
  usernamePattern: (v: string) =>
    !v || /^[a-zA-Z0-9_]+$/.test(v) || t('employee.validation.usernameInvalid'),
  emailRequired: (v: string) => !!v || t('employee.validation.emailRequired'),
  emailPattern: (v: string) =>
    !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t('employee.validation.emailInvalid'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) return
    errorMessage.value = ''
    loading.value = true
    try {
      const [deptTree, positionList, employeePage, employee] = await Promise.all([
        getDepartmentTree(),
        getPositionList(),
        getEmployeePage({ page: 1, size: 200 }),
        props.mode === 'edit' && props.employeeId != null
          ? getEmployee(props.employeeId)
          : Promise.resolve(null),
      ])
      departments.value = deptTree
      positions.value = positionList
      managers.value = employeePage.records

      if (props.mode === 'create') {
        form.username = ''
        form.employeeNo = ''
        form.realName = ''
        form.deptId = null
        form.positionId = null
        form.managerId = null
        form.mobile = ''
        form.email = ''
        form.gender = null
        form.idCardNo = ''
        form.birthday = ''
        form.hireDate = ''
        form.status = '1'
        form.roleIds = []
        version.value = 0
        formRef.value?.resetValidation()
      } else if (employee) {
        form.username = ''
        form.employeeNo = employee.employeeNo ?? ''
        form.realName = employee.realName
        form.deptId = employee.deptId ?? null
        form.positionId = employee.positionId ?? null
        form.managerId = employee.managerId ?? null
        form.mobile = employee.mobile ?? ''
        form.email = employee.email ?? ''
        form.gender = employee.gender ?? null
        form.idCardNo = employee.idCardNo ?? ''
        form.birthday = employee.birthday ?? ''
        form.hireDate = employee.hireDate ?? ''
        form.status = employee.status
        form.roleIds = []
        version.value = employee.version
      }
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('employee.error.loadFailed')
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
      ? createEmployee({
          username: form.username,
          employeeNo: form.employeeNo || undefined,
          realName: form.realName,
          deptId: form.deptId ?? undefined,
          positionId: form.positionId ?? undefined,
          managerId: form.managerId ?? undefined,
          mobile: form.mobile || undefined,
          email: form.email,
          gender: form.gender || undefined,
          idCardNo: form.idCardNo || undefined,
          birthday: form.birthday || undefined,
          hireDate: form.hireDate || undefined,
          status: form.status || undefined,
          roleIds: form.roleIds.length > 0 ? form.roleIds : undefined,
        })
      : updateEmployee({
          id: props.employeeId!,
          employeeNo: form.employeeNo || undefined,
          realName: form.realName,
          deptId: form.deptId ?? undefined,
          positionId: form.positionId ?? undefined,
          managerId: form.managerId ?? undefined,
          mobile: form.mobile || undefined,
          email: form.email || undefined,
          gender: form.gender || undefined,
          idCardNo: form.idCardNo || undefined,
          birthday: form.birthday || undefined,
          hireDate: form.hireDate || undefined,
          status: form.status || undefined,
          version: version.value,
        }))
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('employee.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
