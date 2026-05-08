<template>
  <v-dialog
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : 600"
    :model-value="modelValue"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>
        {{ mode === 'create' ? t('user.form.createTitle') : t('user.form.editTitle') }}
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
          <v-text-field
            v-model="form.username"
            :label="t('user.form.username')"
            :rules="[rules.usernameRequired]"
          />
          <v-text-field
            v-model="form.password"
            :hint="mode === 'edit' ? t('user.form.passwordHint') : undefined"
            :label="t('user.form.password')"
            :persistent-hint="mode === 'edit'"
            :rules="mode === 'create' ? [rules.passwordRequired] : []"
            type="password"
          />
          <v-select
            v-model="form.status"
            :items="statusOptions"
            :label="t('user.form.status')"
            :rules="[rules.statusRequired]"
          />
          <v-autocomplete
            v-model="form.roleIds"
            chips
            clearable
            closable-chips
            :hint="t('user.form.rolesHint')"
            item-title="roleName"
            item-value="id"
            :items="allRoles"
            :label="t('user.form.roles')"
            multiple
            persistent-hint
            variant="outlined"
          >
            <template #chip="{ props: chipProps, item }">
              <v-chip
                v-bind="chipProps"
                :color="item.roleCode ? 'success' : 'info'"
                size="small"
                variant="tonal"
              >
                {{ item.roleName }}
              </v-chip>
            </template>
            <template #item="{ props: itemProps, item }">
              <v-list-item
                v-bind="itemProps"
                :subtitle="item.roleCode ?? t('user.form.compositeRole')"
              />
            </template>
          </v-autocomplete>
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
          {{ t('user.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('user.form.submit') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import type { RoleListResponseItem } from '@/api/schemas/role'
import type { VForm } from 'vuetify/components'
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getRoleList } from '@/api/modules/role'
import { createUser, getUser, updateUser } from '@/api/modules/user'
import { useEnums } from '@/composables/useEnums'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  userId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const { t } = useI18n()
const { smAndDown } = useDisplay()

const form = reactive<{
  username: string
  password: string
  status: string
  roleIds: number[]
}>({
  username: '',
  password: '',
  status: 'ENABLED',
  roleIds: [],
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const allRoles = ref<RoleListResponseItem[]>([])

const { options: statusOptions } = useEnums('user-status')

const rules = {
  usernameRequired: (v: string) => !!v || t('user.validation.usernameRequired'),
  passwordRequired: (v: string) => !!v || t('user.validation.passwordRequired'),
  statusRequired: (v: string) => !!v || t('user.validation.statusRequired'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) return
    errorMessage.value = ''
    loading.value = true
    try {
      // Concurrent fetch: all roles + (in edit mode) current user detail
      const [roles, user] = await Promise.all([
        getRoleList(),
        props.mode === 'edit' && props.userId != null ? getUser(props.userId) : null,
      ])
      allRoles.value = roles

      if (props.mode === 'create') {
        form.username = ''
        form.password = ''
        form.status = ''
        form.roleIds = []
        version.value = 0
        formRef.value?.resetValidation()
      } else if (user) {
        form.username = user.username
        form.password = ''
        form.status = user.status
        form.roleIds = [...(user.roleIds ?? [])]
        version.value = user.version
      }
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('user.error.loadFailed')
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
      ? createUser({
          username: form.username,
          password: form.password,
          status: form.status,
          roleIds: form.roleIds,
        })
      : updateUser({
          id: props.userId!,
          username: form.username,
          password: form.password || undefined,
          status: form.status,
          roleIds: form.roleIds,
          version: version.value,
        }))
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('user.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
