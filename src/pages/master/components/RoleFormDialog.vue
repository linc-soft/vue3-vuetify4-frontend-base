<template>
  <v-dialog
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : 900"
    :model-value="modelValue"
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
        <v-form
          v-else
          ref="formRef"
          @submit.prevent="handleSubmit"
        >
          <!-- 基本情報 -->
          <v-text-field
            v-model="form.roleName"
            :label="t('role.form.roleName')"
            :rules="[rules.roleNameRequired]"
          />
          <v-text-field
            v-model="form.description"
            :label="t('role.form.description')"
          />

          <!-- Inheritance Section -->
          <v-divider class="my-4" />
          <div class="text-subtitle-1 mb-2">
            <v-icon
              class="mr-1"
              icon="mdi-sitemap-outline"
            />
            {{ t('role.form.inheritance') }}
          </div>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ t('role.form.inheritanceHint') }}
          </p>

          <v-row>
            <!-- Left Side: Role Selection List -->
            <v-col
              cols="12"
              md="6"
            >
              <v-text-field
                v-model="searchKeyword"
                class="mb-2"
                clearable
                density="compact"
                hide-details
                :placeholder="t('role.form.searchPlaceholder')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
              />
              <v-card
                border
                class="overflow-y-auto"
                max-height="360"
                variant="outlined"
              >
                <v-list
                  density="compact"
                  select-strategy="leaf"
                >
                  <v-list-item
                    v-for="role in filteredRoles"
                    :key="role.id"
                    :disabled="disabledIds.has(role.id)"
                  >
                    <template #prepend>
                      <v-checkbox-btn
                        :disabled="disabledIds.has(role.id)"
                        :model-value="selectedParentIds.includes(role.id)"
                        @update:model-value="toggleParent(role.id, $event)"
                      />
                    </template>
                    <v-list-item-title>{{ role.roleName }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ role.roleCode }}
                    </v-list-item-subtitle>
                    <template #append>
                      <v-icon
                        v-if="redundantIds.has(role.id)"
                        color="warning"
                        icon="mdi-alert-circle-outline"
                        size="x-small"
                      />
                    </template>
                  </v-list-item>
                  <v-list-item v-if="filteredRoles.length === 0">
                    <v-list-item-title class="text-medium-emphasis">
                      No roles found
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Right Side: Inheritance Tree Preview -->
            <v-col
              cols="12"
              md="6"
            >
              <div class="text-body-2 font-weight-medium mb-2">
                <v-icon
                  class="mr-1"
                  icon="mdi-file-tree-outline"
                  size="18"
                />
                {{ t('role.form.treeTitle') }}
              </div>
              <v-card
                border
                class="overflow-y-auto pa-2"
                max-height="390"
                min-height="300"
                variant="outlined"
              >
                <template v-if="inheritanceTree.length > 0">
                  <RoleTreeNodeItem
                    v-for="node in inheritanceTree"
                    :key="node.id"
                    :node="node"
                    @remove="removeParent"
                  />
                </template>
                <div
                  v-else
                  class="d-flex align-center justify-center text-medium-emphasis text-body-2"
                  style="min-height: 280px"
                >
                  {{ t('role.form.treeEmpty') }}
                </div>
              </v-card>
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
          :disabled="loading"
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('role.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('role.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { RoleListResponseItem } from '@/api/schemas/role'
import type { VForm } from 'vuetify/components'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import {
  addRoleInheritance,
  createRole,
  getParentRoles,
  getRoleList,
  removeRoleInheritance,
  updateRole,
} from '@/api/modules/role'
import { useRoleInheritance } from '@/composables/useRoleInheritance'
import RoleTreeNodeItem from './RoleTreeNodeItem.vue'

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
const { smAndDown } = useDisplay()

const form = reactive({
  roleName: '',
  description: '',
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

// Inheritance-related status
const allRoles = ref<RoleListResponseItem[]>([])
const selectedParentIds = ref<number[]>([])
const searchKeyword = ref('')

// composable
const currentRoleId = computed(() => props.roleId)
const { disabledIds, inheritanceTree, redundantIds } = useRoleInheritance(
  allRoles,
  currentRoleId,
  selectedParentIds,
)

// Search Filters
const filteredRoles = computed(() => {
  const keyword = searchKeyword.value?.toLowerCase() ?? ''
  return allRoles.value.filter(r => {
    if (r.id === props.roleId) return false
    if (!keyword) return true
    return r.roleName.toLowerCase().includes(keyword) || r.roleCode?.toLowerCase().includes(keyword)
  })
})

const rules = {
  roleNameRequired: (v: string) => !!v || t('role.validation.roleNameRequired'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) return
    errorMessage.value = ''
    searchKeyword.value = ''

    // Get all role list
    loading.value = true
    try {
      allRoles.value = await getRoleList()
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('role.error.loadFailed')
    } finally {
      loading.value = false
    }

    if (props.mode === 'create') {
      form.roleName = ''
      form.description = ''
      selectedParentIds.value = []
      version.value = 0
      formRef.value?.resetValidation()
    } else if (props.roleId != null) {
      loading.value = true
      try {
        const [role, parents] = await Promise.all([
          (await import('@/api/modules/role')).getRole(props.roleId),
          getParentRoles(props.roleId),
        ])
        form.roleName = role.roleName
        form.description = role.description ?? ''
        version.value = role.version
        selectedParentIds.value = parents.map(p => p.id)
      } catch (error: unknown) {
        errorMessage.value = error instanceof Error ? error.message : t('role.error.loadFailed')
      } finally {
        loading.value = false
      }
    }
  },
)

function toggleParent(roleId: number, checked: boolean) {
  if (checked) {
    if (!selectedParentIds.value.includes(roleId)) {
      selectedParentIds.value = [...selectedParentIds.value, roleId]
    }
  } else {
    selectedParentIds.value = selectedParentIds.value.filter(id => id !== roleId)
  }
}

function removeParent(roleId: number) {
  selectedParentIds.value = selectedParentIds.value.filter(id => id !== roleId)
}

async function handleSubmit() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  submitting.value = true
  errorMessage.value = ''
  try {
    if (props.mode === 'create') {
      const createdId = await createRole({
        roleName: form.roleName,
        description: form.description || undefined,
      })
      // Add inheritance relationship
      for (const parentId of selectedParentIds.value) {
        await addRoleInheritance({ childRoleId: createdId, parentRoleId: parentId })
      }
    } else {
      await updateRole({
        id: props.roleId!,
        roleName: form.roleName,
        description: form.description || undefined,
        version: version.value,
      })

      // Differential update of inheritance relationship
      const originalParentIds = allRoles.value.find(r => r.id === props.roleId)?.parentRoleIds ?? []
      const toAdd = selectedParentIds.value.filter(id => !originalParentIds.includes(id))
      const toRemove = originalParentIds.filter(id => !selectedParentIds.value.includes(id))

      for (const parentId of toAdd) {
        await addRoleInheritance({ childRoleId: props.roleId!, parentRoleId: parentId })
      }
      for (const parentId of toRemove) {
        await removeRoleInheritance({ childRoleId: props.roleId!, parentRoleId: parentId })
      }
    }

    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('role.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
