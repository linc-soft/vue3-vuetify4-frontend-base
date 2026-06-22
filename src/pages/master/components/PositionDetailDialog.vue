<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 500"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ t('position.detail.title') }}</v-card-title>
      <v-card-text>
        <div
          v-if="loading"
          class="d-flex justify-center py-8"
        >
          <v-progress-circular indeterminate />
        </div>
        <template v-else-if="position">
          <v-list>
            <v-list-item :title="t('position.table.positionName')">
              <template #subtitle>{{ position.positionName }}</template>
            </v-list-item>
            <v-list-item :title="t('position.table.positionCode')">
              <template #subtitle>{{ position.positionCode || '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('position.table.sortOrder')">
              <template #subtitle>{{ position.sortOrder ?? '-' }}</template>
            </v-list-item>
            <v-list-item :title="t('position.table.status')">
              <template #subtitle>{{ commonStatusLabelOf(position.status) }}</template>
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
          v-perm="'position:delete'"
          color="error"
          :disabled="loading || !position"
          variant="tonal"
          @click="deleteDialog = true"
        >
          {{ t('position.actions.delete') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('update:modelValue', false)"
        >
          {{ t('position.detail.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ t('position.delete.title') }}</v-card-title>
        <v-card-text>
          <p>{{ t('position.delete.message') }}</p>
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
            {{ t('position.delete.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteLoading"
            variant="elevated"
            @click="handleDelete"
          >
            {{ t('position.delete.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { PositionInfoResponse } from '@/api/schemas/position'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { deletePosition, getPosition } from '@/api/modules/position'
import { useEnums } from '@/composables/useEnums'

const props = defineProps<{
  modelValue: boolean
  positionId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted'): void
}>()

const { t } = useI18n()
const { mobile } = useDisplay()
const { labelOf: commonStatusLabelOf } = useEnums('common-status')

const position = ref<PositionInfoResponse | null>(null)
const loading = ref(false)
const errorMessage = ref('')

const deleteDialog = ref(false)
const deleteLoading = ref(false)
const deleteErrorMessage = ref('')

watch(
  () => props.modelValue,
  async open => {
    if (open && props.positionId != null) {
      loading.value = true
      errorMessage.value = ''
      position.value = null
      try {
        position.value = await getPosition(props.positionId)
      } catch (error: unknown) {
        errorMessage.value = error instanceof Error ? error.message : t('position.error.loadFailed')
      } finally {
        loading.value = false
      }
    }
  },
)

async function handleDelete() {
  if (!position.value) return
  deleteLoading.value = true
  deleteErrorMessage.value = ''
  try {
    await deletePosition({ id: position.value.id, version: position.value.version })
    deleteDialog.value = false
    emit('deleted')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    deleteErrorMessage.value =
      error instanceof Error ? error.message : t('position.error.deleteFailed')
  } finally {
    deleteLoading.value = false
  }
}
</script>
