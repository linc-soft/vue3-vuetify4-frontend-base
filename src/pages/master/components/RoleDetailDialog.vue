<template>
  <v-dialog
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : 600"
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
              <template #subtitle>{{ role.roleCode }}</template>
            </v-list-item>
            <v-list-item :title="t('role.table.description')">
              <template #subtitle>{{ role.description ?? '-' }}</template>
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
          variant="tonal"
          @click="deleteDialog = true"
        >
          {{ t('role.actions.delete') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('role.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Delete Confirmation Dialog -->
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
import type { RoleInfoResponse } from '@/api/schemas/role'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteRole, getRole } from '@/api/modules/role'

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

const role = ref<RoleInfoResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteErrorMessage = ref('')

watch(
  () => props.modelValue,
  async open => {
    if (open && props.roleId != null) {
      loading.value = true
      errorMessage.value = ''
      role.value = null
      try {
        role.value = await getRole(props.roleId)
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
    emit('deleted')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    deleteErrorMessage.value = error instanceof Error ? error.message : t('role.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
