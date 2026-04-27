<template>
  <v-dialog
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : 600"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('user.detail.title') }}</v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <template v-else-if="user">
          <v-list>
            <v-list-item :title="t('user.table.username')">
              <template #subtitle>{{ user.username }}</template>
            </v-list-item>
            <v-list-item :title="t('user.table.status')">
              <template #subtitle>{{ statusLabelOf(user.status) }}</template>
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
          :disabled="loading || !user"
          variant="tonal"
          @click="deleteDialog = true"
        >
          {{ t('user.actions.delete') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('user.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 删除确认对话框 -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('user.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('user.delete.message') }}</p>
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
            {{ t('user.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('user.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { UserInfoResponse } from '@/api/schemas/user'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deleteUser, getUser } from '@/api/modules/user'
import { useEnums } from '@/composables/useEnums'

const props = defineProps<{
  modelValue: boolean
  userId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted'): void
}>()

const { t } = useI18n()
const { smAndDown } = useDisplay()
const { labelOf: statusLabelOf } = useEnums('user-status')

const user = ref<UserInfoResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteErrorMessage = ref('')

watch(
  () => props.modelValue,
  async open => {
    if (open && props.userId != null) {
      loading.value = true
      errorMessage.value = ''
      user.value = null
      try {
        user.value = await getUser(props.userId)
      } catch (error: unknown) {
        errorMessage.value = error instanceof Error ? error.message : t('user.error.loadFailed')
      } finally {
        loading.value = false
      }
    }
  },
)

async function handleDelete() {
  if (!user.value) return
  deleteLoading.value = true
  deleteErrorMessage.value = ''
  try {
    await deleteUser({ id: user.value.id, version: user.value.version })
    deleteDialog.value = false
    emit('deleted')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    deleteErrorMessage.value = error instanceof Error ? error.message : t('user.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
