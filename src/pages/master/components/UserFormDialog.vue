<template>
  <v-dialog
    :fullscreen="mobile"
    :max-width="mobile ? undefined : 600"
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
            v-if="mode === 'edit'"
            v-model="form.password"
            :hint="t('user.form.passwordHint')"
            :label="t('user.form.password')"
            persistent-hint
            type="password"
          />
          <v-text-field
            v-model="form.email"
            :label="t('user.form.email')"
            :rules="
              mode === 'create' ? [rules.emailRequired, rules.emailPattern] : [rules.emailPattern]
            "
            type="email"
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
            :items="roleOptions"
            :label="t('user.form.roles')"
            multiple
            persistent-hint
            variant="outlined"
          >
            <template #chip="{ props: chipProps, item }">
              <v-chip
                v-bind="chipProps"
                :color="roleDescriptionOf(item.value) ? 'success' : 'info'"
                size="small"
                variant="tonal"
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
import type { VForm } from 'vuetify/components'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { createUser, getUser, updateUser } from '@/api/modules/user'
import { useSelectOptions } from '@/composables/useSelectOptions'
import { useUserStatus } from '@/composables/useUserStatus'

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
const { mobile } = useDisplay()

const form = reactive<{
  username: string
  password: string
  email: string
  status: string
  roleIds: number[]
}>({
  username: '',
  password: '',
  email: '',
  status: '',
  roleIds: [],
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const { options: statusOptions } = useUserStatus()
const { items: roleItems, descriptionOf: roleDescriptionOf } = useSelectOptions('role')

// Map role items to options with composite role label for empty description
const roleOptions = computed(() =>
  roleItems.value.map(item => ({
    title: item.label,
    value: item.value,
    props: { subtitle: item.description || t('user.form.compositeRole') },
  })),
)

const rules = {
  usernameRequired: (v: string) => !!v || t('user.validation.usernameRequired'),
  statusRequired: (v: string) => !!v || t('user.validation.statusRequired'),
  emailRequired: (v: string) => !!v || t('user.validation.emailRequired'),
  emailPattern: (v: string) =>
    !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t('user.validation.emailInvalid'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) return
    errorMessage.value = ''
    loading.value = true
    try {
      // In edit mode, fetch current user detail
      const user =
        props.mode === 'edit' && props.userId != null ? await getUser(props.userId) : null

      if (props.mode === 'create') {
        form.username = ''
        form.password = ''
        form.email = ''
        form.status = '2' // INACTIVE by default
        form.roleIds = []
        version.value = 0
        formRef.value?.resetValidation()
      } else if (user) {
        form.username = user.username
        form.password = ''
        form.email = user.email ?? ''
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
          email: form.email,
          roleIds: form.roleIds,
        })
      : updateUser({
          id: props.userId!,
          username: form.username,
          password: form.password || undefined,
          email: form.email || undefined,
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
