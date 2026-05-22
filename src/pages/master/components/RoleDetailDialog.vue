<template>
  <v-dialog
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : 500"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('role.detail.title') }}</v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <template v-else-if="role">
          <v-list>
            <v-list-item :title="t('role.table.roleName')">
              <template #subtitle>{{ role.roleName }}</template>
            </v-list-item>
            <v-list-item :title="t('role.table.roleCode')">
              <template #subtitle>{{ role.roleCode ?? '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('role.table.description')">
              <template #subtitle>{{ role.description ?? '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('role.detail.parentRoles')">
              <template #subtitle>
                <div
                  v-if="directParents.length === 0"
                  class="text-body-2 text-medium-emphasis"
                >
                  -
                </div>
                <v-chip-group
                  v-else
                  column
                >
                  <v-chip
                    v-for="p in directParents"
                    :key="p.id"
                    :color="p.roleCode ? 'success' : 'info'"
                    size="small"
                    variant="tonal"
                  >
                    {{ p.roleName }}
                    <span
                      v-if="p.roleCode"
                      class="text-disabled ml-1"
                    >
                      · {{ p.roleCode }}
                    </span>
                  </v-chip>
                </v-chip-group>
              </template>
            </v-list-item>
            <v-list-item :title="t('role.detail.effectiveBaseRoles')">
              <template #subtitle>
                <div
                  v-if="effectiveBaseRoles.length === 0"
                  class="text-body-2 text-medium-emphasis"
                >
                  {{ role.roleCode ? t('role.detail.selfIsBaseRole') : '-' }}
                </div>
                <v-chip-group
                  v-else
                  column
                >
                  <v-chip
                    v-for="r in effectiveBaseRoles"
                    :key="r.id"
                    color="primary"
                    size="small"
                    variant="tonal"
                  >
                    {{ r.roleName }}
                    <span class="text-disabled ml-1">· {{ r.roleCode }}</span>
                  </v-chip>
                </v-chip-group>
              </template>
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
          color="error"
          :disabled="loading || !role"
          :loading="deleteLoading"
          variant="tonal"
          @click="deleteDialog = true"
        >
          {{ t('role.actions.delete') }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="secondary"
          :disabled="loading || !role"
          prepend-icon="mdi-file-pdf-box"
          variant="outlined"
          @click="exportPdf"
        >
          {{ t('role.pdf.exportDetail') }}
        </v-btn>
        <v-btn
          :disabled="loading"
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('role.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Delete Confirm Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('role.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('role.delete.message') }}</p>
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
            {{ t('role.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('role.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { RoleListResponseItem } from '@/api/schemas/role'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteRole, getRole, getRoleList } from '@/api/modules/role'
import { type DetailField, generateDetailPdf } from '@/utils/pdf'

const props = defineProps<{
  modelValue: boolean
  roleId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted'): void
}>()

const { t } = useI18n()
const { smAndDown } = useDisplay()

const role = ref<Awaited<ReturnType<typeof getRole>> | null>(null)
const allRoles = ref<RoleListResponseItem[]>([])
const loading = ref(false)
const errorMessage = ref('')

const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteErrorMessage = ref('')

const roleMap = computed(
  () => new Map<number, RoleListResponseItem>(allRoles.value.map(r => [r.id, r])),
)

// Direct parent roles
const directParents = computed<RoleListResponseItem[]>(() => {
  if (!role.value) return []
  return role.value.parentRoleIds
    .map(id => roleMap.value.get(id))
    .filter((r): r is RoleListResponseItem => !!r)
})

// Transitive closure: expand upward from direct parent roles and collect base roles that have a roleCode
const effectiveBaseRoles = computed<RoleListResponseItem[]>(() => {
  if (!role.value) return []
  const visited = new Set<number>()
  const queue: number[] = [...role.value.parentRoleIds]
  const result: RoleListResponseItem[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const r = roleMap.value.get(id)
    if (!r) continue
    if (r.roleCode) result.push(r)
    for (const pid of r.parentRoleIds) {
      if (!visited.has(pid)) queue.push(pid)
    }
  }
  return result
})

// PDF fields definition
const pdfFields = computed<DetailField<Awaited<ReturnType<typeof getRole>>>[]>(() => [
  { label: t('role.table.roleName'), key: 'roleName' },
  { label: t('role.table.roleCode'), key: 'roleCode' },
  { label: t('role.table.description'), key: 'description' },
  {
    label: t('role.detail.parentRoles'),
    key: 'parentRoleIds',
    render: () => {
      if (directParents.value.length === 0) return '-'
      return directParents.value.map(r => r.roleName).join(', ')
    },
  },
  {
    label: t('role.detail.effectiveBaseRoles'),
    key: 'effectiveBaseRoles',
    render: () => {
      if (effectiveBaseRoles.value.length === 0) {
        return role.value?.roleCode ? t('role.detail.selfIsBaseRole') : '-'
      }
      return effectiveBaseRoles.value.map(r => `${r.roleName}(${r.roleCode})`).join(', ')
    },
  },
])

watch(
  () => props.modelValue,
  async open => {
    if (open && props.roleId != null) {
      loading.value = true
      errorMessage.value = ''
      role.value = null
      try {
        const [detail, list] = await Promise.all([getRole(props.roleId), getRoleList()])
        role.value = detail
        allRoles.value = list
      } catch (error: unknown) {
        errorMessage.value = error instanceof Error ? error.message : t('role.error.loadFailed')
      } finally {
        loading.value = false
      }
    }
  },
)

async function handleDelete() {
  if (!role.value) return
  deleteLoading.value = true
  deleteErrorMessage.value = ''
  try {
    await deleteRole({ id: role.value.id, version: role.value.version })
    deleteDialog.value = false
    emit('update:modelValue', false)
    emit('deleted')
  } catch (error: unknown) {
    deleteErrorMessage.value = error instanceof Error ? error.message : t('role.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}

// Export PDF
async function exportPdf() {
  if (!role.value) return
  await generateDetailPdf(
    {
      title: t('role.pdf.detailTitle'),
      filename: `角色详情_${role.value.roleName}`,
    },
    pdfFields.value,
    role.value,
  )
}
</script>
