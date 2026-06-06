<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
    :model-value="modelValue"
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
            <v-list-item :title="t('employee.table.username')">
              <template #subtitle>{{ employee.username }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.email')">
              <template #subtitle>{{ employee.email || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.nickname')">
              <template #subtitle>{{ employee.nickname || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.mobile')">
              <template #subtitle>{{ employee.mobile || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.sex')">
              <template #subtitle>{{ sexLabelOf(employee.sex) }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.form.hiredDate')">
              <template #subtitle>{{ employee.hiredDate || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.table.status')">
              <template #subtitle>{{ statusLabelOf(employee.status) }}</template>
            </v-list-item>
            <v-list-item :title="t('employee.detail.roles')">
              <template #subtitle>
                <div
                  v-if="assignedRoles.length === 0"
                  class="text-medium-emphasis"
                >
                  {{ t('employee.detail.noRoles') }}
                </div>
                <v-chip-group
                  v-else
                  class="mt-1"
                  column
                >
                  <v-chip
                    v-for="r in assignedRoles"
                    :key="r.id"
                    :color="r.roleCode ? 'success' : 'info'"
                    size="small"
                    variant="tonal"
                  >
                    {{ r.roleName }}
                    <span
                      v-if="r.roleCode"
                      class="text-disabled ml-1"
                    >
                      · {{ r.roleCode }}
                    </span>
                  </v-chip>
                </v-chip-group>
              </template>
            </v-list-item>
            <v-list-item
              v-if="employee.remark"
              :title="t('employee.form.remark')"
            >
              <template #subtitle>{{ employee.remark }}</template>
            </v-list-item>
            <v-divider class="my-3" />
            <v-list-subheader>{{ t('employee.detail.annualLeave') }}</v-list-subheader>
            <v-alert
              v-if="!hasAnnualLeave"
              class="mb-3"
              density="compact"
              type="info"
              variant="tonal"
            >
              {{ t('employee.detail.notInitialized') }}
            </v-alert>
            <div
              v-else
              class="d-flex flex-wrap ga-6 px-3 pb-3"
            >
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('employee.detail.totalAnnualDays') }}
                </div>
                <div class="text-h6">
                  {{ employee.totalAnnualDays }}
                  <span class="text-caption text-medium-emphasis">
                    {{ t('employee.detail.days') }}
                  </span>
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('employee.detail.usedAnnualDays') }}
                </div>
                <div class="text-h6">
                  {{ employee.usedAnnualDays }}
                  <span class="text-caption text-medium-emphasis">
                    {{ t('employee.detail.days') }}
                  </span>
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('employee.detail.remainAnnualDays') }}
                </div>
                <div class="text-h6">
                  {{ employee.remainAnnualDays }}
                  <span class="text-caption text-medium-emphasis">
                    {{ t('employee.detail.days') }}
                  </span>
                </div>
              </div>
              <div>
                <div class="text-caption text-medium-emphasis">
                  {{ t('employee.detail.otherLeaveDays') }}
                </div>
                <div class="text-h6">
                  {{ employee.otherLeaveDays }}
                  <span class="text-caption text-medium-emphasis">
                    {{ t('employee.detail.days') }}
                  </span>
                </div>
              </div>
            </div>
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
          color="error"
          :disabled="loading || !employee"
          variant="tonal"
          @click="deleteDialog = true"
        >
          {{ t('employee.actions.delete') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('employee.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('employee.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('employee.delete.message') }}</p>
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
  </v-dialog>
</template>

<script lang="ts" setup>
import type { EmployeeResponse } from '@/api/schemas/employee'
import type { RoleListResponseItem } from '@/api/schemas/role'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteEmployee, getEmployee } from '@/api/modules/employee'
import { getRoleList } from '@/api/modules/role'
import { useUserStatus } from '@/composables/useUserStatus'

const props = defineProps<{
  modelValue: boolean
  employeeId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { labelOf: statusLabelOf } = useUserStatus()

const employee = ref<EmployeeResponse | null>(null)
const allRoles = ref<RoleListResponseItem[]>([])
const loading = ref(false)
const errorMessage = ref('')
const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteErrorMessage = ref('')

const roleMap = computed(
  () => new Map<number, RoleListResponseItem>(allRoles.value.map(r => [r.id, r])),
)

const assignedRoles = computed<RoleListResponseItem[]>(() => {
  const ids = employee.value?.roleIds ?? []
  return ids.map(id => roleMap.value.get(id)).filter((r): r is RoleListResponseItem => r != null)
})

const hasAnnualLeave = computed(
  () => employee.value?.totalAnnualDays != null && employee.value?.remainAnnualDays != null,
)

function sexLabelOf(sex: number | null) {
  if (sex === 0) return t('employee.sex.male')
  if (sex === 1) return t('employee.sex.female')
  return '-'
}

watch(
  () => props.modelValue,
  async open => {
    if (open && props.employeeId != null) {
      loading.value = true
      errorMessage.value = ''
      employee.value = null
      try {
        const [detail, roles] = await Promise.all([getEmployee(props.employeeId), getRoleList()])
        employee.value = detail
        allRoles.value = roles
      } catch (error: unknown) {
        errorMessage.value = error instanceof Error ? error.message : t('employee.error.loadFailed')
      } finally {
        loading.value = false
      }
    }
  },
)

async function handleDelete() {
  if (!employee.value) return
  deleteLoading.value = true
  deleteErrorMessage.value = ''
  try {
    await deleteEmployee(employee.value.id)
    deleteDialog.value = false
    emit('deleted')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    deleteErrorMessage.value =
      error instanceof Error ? error.message : t('employee.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
