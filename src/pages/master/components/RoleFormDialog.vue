<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 640"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>
        {{ mode === 'create' ? t('role.form.createTitle') : t('role.form.editTitle') }}
      </v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <template v-else>
          <v-form
            ref="formRef"
            autocomplete="off"
            @submit.prevent="handleSubmit"
          >
            <v-text-field
              v-model="form.roleName"
              density="compact"
              :label="t('role.form.roleName')"
              :rules="[rules.roleNameRequired]"
              variant="outlined"
            />
            <v-text-field
              v-model="form.description"
              density="compact"
              :label="t('role.form.description')"
              variant="outlined"
            />
            <RoleAutocomplete
              v-model="form.parentRoleIds"
              density="compact"
              :exclude-id="props.roleId ?? null"
              :hint="t('role.form.parentRolesHint')"
              :items="allRoles"
              :label="t('role.form.parentRoles')"
            />
          </v-form>

          <!-- Inheritance preview (responsive, no hover dependency) -->
          <v-card
            v-if="form.parentRoleIds.length > 0"
            class="mt-4"
            variant="tonal"
          >
            <v-card-title class="text-subtitle-2">
              {{ t('role.form.previewTitle') }}
            </v-card-title>
            <v-card-text>
              <!-- Effective base roles -->
              <div class="text-caption text-medium-emphasis mb-1">
                {{ t('role.form.effectiveBaseRoles') }}
              </div>
              <div
                v-if="effectiveBaseRoles.length === 0"
                class="text-body-2 text-medium-emphasis mb-2"
              >
                {{ t('role.form.noBaseRoles') }}
              </div>
              <v-chip-group
                v-else
                class="mb-2"
                column
              >
                <v-chip
                  v-for="r in effectiveBaseRoles"
                  :key="r.id"
                  color="primary"
                  size="small"
                  variant="tonal"
                >
                  {{ displayName(r) }}
                  <span class="text-disabled ml-1">· {{ r.roleCode }}</span>
                </v-chip>
              </v-chip-group>

              <!-- Inheritance chain details (click to expand, mobile-friendly) -->
              <v-expansion-panels
                class="mt-2"
                variant="accordion"
              >
                <v-expansion-panel
                  v-for="id in form.parentRoleIds"
                  :key="id"
                >
                  <v-expansion-panel-title>
                    <span class="text-body-2">
                      {{ displayName(roleMap.get(id)) }}
                    </span>
                    <template #actions>
                      <v-icon>mdi-chevron-down</v-icon>
                    </template>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div
                      v-for="(node, idx) in flattenedTree(id)"
                      :key="`${id}-${idx}-${node.role.id}`"
                      class="d-flex align-center py-1"
                      :style="{ paddingLeft: `${node.depth * 16}px` }"
                    >
                      <v-icon
                        v-if="node.depth > 0"
                        class="mr-1"
                        size="x-small"
                      >
                        mdi-subdirectory-arrow-right
                      </v-icon>
                      <v-chip
                        class="mr-2"
                        :color="node.role.roleCode ? 'success' : 'info'"
                        size="x-small"
                        variant="tonal"
                      >
                        {{ badgeLabel(node.role.id) }}
                      </v-chip>
                      <span class="text-body-2">{{ displayName(node.role) }}</span>
                      <span
                        v-if="node.role.roleCode"
                        class="text-caption text-medium-emphasis ml-2"
                      >
                        · {{ node.role.roleCode }}
                      </span>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
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
          :disabled="loading"
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('role.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading || confirmDialog"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('role.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="confirmDialog"
      :fullscreen="mobile"
      :max-width="mobile ? undefined : 400"
    >
      <v-card>
        <v-card-title>{{ t('role.form.confirmTitle') }}</v-card-title>
        <v-card-text>
          {{
            mode === 'create'
              ? t('role.form.confirmCreateMessage')
              : t('role.form.confirmEditMessage')
          }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            :disabled="submitting"
            variant="text"
            @click="confirmDialog = false"
          >
            {{ t('role.form.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="submitting"
            variant="elevated"
            @click="confirmSubmit"
          >
            {{ t('role.form.confirmYes') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { RoleListResponseItem } from '@/api/schemas/role'
import type { VForm } from 'vuetify/components'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { createRole, getRole, getRoleList, updateRole } from '@/api/modules/role'
import RoleAutocomplete from '@/components/RoleAutocomplete.vue'
import { useRoleDisplay } from '@/composables/useRoleDisplay'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  roleId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { displayName } = useRoleDisplay()

const form = reactive<{
  roleName: string
  description: string
  parentRoleIds: number[]
}>({
  roleName: '',
  description: '',
  parentRoleIds: [],
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const confirmDialog = ref(false)

// All roles (used to build the inheritance graph)
const allRoles = ref<RoleListResponseItem[]>([])
const roleMap = computed(
  () => new Map<number, RoleListResponseItem>(allRoles.value.map(r => [r.id, r])),
)

const rules = {
  roleNameRequired: (v: string) => !!v || t('role.validation.roleNameRequired'),
}

function isBaseRoleId(id: number | undefined): boolean {
  return id != null && !!roleMap.value.get(id)?.roleCode
}

function badgeLabel(id: number | undefined): string {
  return isBaseRoleId(id) ? t('role.form.badgeBase') : t('role.form.badgeComposite')
}
// Transitive closure BFS: returns all ancestors (including self) recursively expanded from the selected parent roles; visited prevents cycles
function resolveAncestors(rootIds: number[]): RoleListResponseItem[] {
  const visited = new Set<number>()
  const queue: number[] = [...rootIds]
  const result: RoleListResponseItem[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const r = roleMap.value.get(id)
    if (!r) continue
    result.push(r)
    for (const pid of r.parentRoleIds) {
      if (!visited.has(pid)) queue.push(pid)
    }
  }
  return result
}

// Effective base roles = nodes in the transitive closure that have a roleCode
const effectiveBaseRoles = computed(() =>
  resolveAncestors(form.parentRoleIds).filter(r => r.roleCode),
)

// Flatten a single-root inheritance chain with depth for indented rendering (duplicates allowed in DAG scenarios)
function flattenedTree(rootId: number): { role: RoleListResponseItem; depth: number }[] {
  const out: { role: RoleListResponseItem; depth: number }[] = []
  const walk = (id: number, depth: number, visited: Set<number>) => {
    if (visited.has(id)) return
    const role = roleMap.value.get(id)
    if (!role) return
    out.push({ role, depth })
    const next = new Set(visited)
    next.add(id)
    for (const pid of role.parentRoleIds) walk(pid, depth + 1, next)
  }
  walk(rootId, 0, new Set())
  return out
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
      // Concurrent fetch: all roles + (in edit mode) current role detail
      const [list, detail] = await Promise.all([
        getRoleList(),
        props.mode === 'edit' && props.roleId != null ? getRole(props.roleId) : null,
      ])
      allRoles.value = list

      if (props.mode === 'create') {
        form.roleName = ''
        form.description = ''
        form.parentRoleIds = []
        version.value = 0
        formRef.value?.resetValidation()
      } else if (detail) {
        form.roleName = detail.roleName
        form.description = detail.description ?? ''
        form.parentRoleIds = [...detail.parentRoleIds]
        version.value = detail.version
      }
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('role.error.loadFailed')
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
      ? createRole({
          roleName: form.roleName,
          description: form.description || undefined,
          parentRoleIds: form.parentRoleIds,
        })
      : updateRole({
          id: props.roleId!,
          roleName: form.roleName,
          description: form.description || undefined,
          version: version.value,
          parentRoleIds: form.parentRoleIds,
        }))

    confirmDialog.value = false
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    confirmDialog.value = false
    errorMessage.value = error instanceof Error ? error.message : t('role.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
