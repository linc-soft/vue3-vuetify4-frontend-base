<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('employee.detail.title') }}</v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <template v-else-if="employee">
          <v-list>
            <v-list-item :title="t('employee.table.realName')">
              <template #subtitle>{{ employee.realName }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.table.employeeNo')">
              <template #subtitle>{{ employee.employeeNo || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.dept')">
              <template #subtitle>{{ deptLabel }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.position')">
              <template #subtitle>{{ positionLabel }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.manager')">
              <template #subtitle>{{ managerLabel }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.table.mobile')">
              <template #subtitle>{{ employee.mobile || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.table.email')">
              <template #subtitle>{{ employee.email || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.gender')">
              <template #subtitle>{{
                employee.gender ? genderLabelOf(employee.gender) : '-'
              }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.birthday')">
              <template #subtitle>{{ employee.birthday || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.table.hireDate')">
              <template #subtitle>{{ employee.hireDate || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.table.status')">
              <template #subtitle>{{ statusLabelOf(employee.status) }}</template>
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
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('employee.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { DepartmentTreeResponse } from '@/api/schemas/department'
import type { EmployeeInfoResponse, EmployeePageResponseItem } from '@/api/schemas/employee'
import type { PositionInfoResponse } from '@/api/schemas/position'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getDepartmentTree } from '@/api/modules/department'
import { getEmployee, getEmployeePage } from '@/api/modules/employee'
import { getPositionList } from '@/api/modules/position'
import { useEmployeeStatus, useGender } from '@/composables/useCommonStatus'

const props = defineProps<{
  modelValue: boolean
  employeeId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { labelOf: statusLabelOf } = useEmployeeStatus()
const { labelOf: genderLabelOf } = useGender()

const employee = ref<EmployeeInfoResponse | null>(null)
const departments = ref<DepartmentTreeResponse[]>([])
const positions = ref<PositionInfoResponse[]>([])
const employees = ref<EmployeePageResponseItem[]>([])
const loading = ref(false)
const errorMessage = ref('')

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

const deptLabel = computed(() =>
  employee.value?.deptId == null ? '-' : (deptNameMap.value.get(employee.value.deptId) ?? '-'),
)

const positionLabel = computed(() => {
  if (employee.value?.positionId == null) return '-'
  return positions.value.find(p => p.id === employee.value!.positionId)?.positionName ?? '-'
})

const managerLabel = computed(() => {
  if (employee.value?.managerId == null) return '-'
  return employees.value.find(e => e.id === employee.value!.managerId)?.realName ?? '-'
})

watch(
  () => props.modelValue,
  async open => {
    if (!open || props.employeeId == null) return
    loading.value = true
    errorMessage.value = ''
    employee.value = null
    try {
      const [detail, deptTree, positionList, employeePage] = await Promise.all([
        getEmployee(props.employeeId),
        getDepartmentTree(),
        getPositionList(),
        getEmployeePage({ page: 1, size: 200 }),
      ])
      employee.value = detail
      departments.value = deptTree
      positions.value = positionList
      employees.value = employeePage.records
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('employee.error.loadFailed')
    } finally {
      loading.value = false
    }
  },
)
</script>
