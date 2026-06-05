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
        {{ mode === 'create' ? t('employee.form.createTitle') : t('employee.form.editTitle') }}
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
            v-if="mode === 'create'"
            v-model="form.username"
            :label="t('employee.form.username')"
            :rules="[rules.usernameRequired]"
          />
          <v-text-field
            v-if="mode === 'edit'"
            v-model="form.password"
            :hint="t('employee.form.passwordHint')"
            :label="t('employee.form.password')"
            persistent-hint
            type="password"
          />
          <v-text-field
            v-model="form.email"
            :label="t('employee.form.email')"
            :rules="[rules.emailRequired, rules.emailPattern]"
            type="email"
          />
          <v-text-field
            v-model="form.nickname"
            :label="t('employee.form.nickname')"
            :rules="[rules.nicknameRequired]"
          />
          <v-text-field
            v-model="form.mobile"
            :label="t('employee.form.mobile')"
          />
          <v-select
            v-model="form.sex"
            :items="sexOptions"
            :label="t('employee.form.sex')"
          />
          <v-text-field
            v-model="form.hiredDate"
            :label="t('employee.form.hiredDate')"
            type="date"
          />
          <v-select
            v-if="mode === 'edit'"
            v-model="form.status"
            :items="statusOptions"
            :label="t('employee.form.status')"
            :rules="[rules.statusRequired]"
          />
          <v-autocomplete
            v-model="form.roleIds"
            chips
            clearable
            closable-chips
            :hint="t('employee.form.rolesHint')"
            :items="roleOptions"
            :label="t('employee.form.roles')"
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
          <v-textarea
            v-model="form.remark"
            :label="t('employee.form.remark')"
            rows="2"
          />
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
          {{ t('employee.form.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="loading"
          :loading="submitting"
          variant="elevated"
          @click="handleSubmit"
        >
          {{ t('employee.form.submit') }}
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

import { createEmployee, getEmployee, updateEmployee } from '@/api/modules/employee'
import { useSelectOptions } from '@/composables/useSelectOptions'
import { useUserStatus } from '@/composables/useUserStatus'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  employeeId: number | null
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
  nickname: string
  mobile: string
  sex: string
  hiredDate: string
  status: string
  roleIds: number[]
  remark: string
}>({
  username: '',
  password: '',
  email: '',
  nickname: '',
  mobile: '',
  sex: '',
  hiredDate: '',
  status: '',
  roleIds: [],
  remark: '',
})
const version = ref(0)
const formRef = ref<VForm>()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const { options: statusOptions } = useUserStatus()
const { items: roleItems, descriptionOf: roleDescriptionOf } = useSelectOptions('role')

const sexOptions = computed(() => [
  { title: t('employee.sex.male'), value: 'MALE' },
  { title: t('employee.sex.female'), value: 'FEMALE' },
])

const roleOptions = computed(() =>
  roleItems.value.map(item => ({
    title: item.label,
    value: item.value,
    props: { subtitle: item.description || t('employee.form.compositeRole') },
  })),
)

const rules = {
  usernameRequired: (v: string) => !!v || t('employee.validation.usernameRequired'),
  nicknameRequired: (v: string) => !!v || t('employee.validation.nicknameRequired'),
  emailRequired: (v: string) => !!v || t('employee.validation.emailRequired'),
  emailPattern: (v: string) =>
    !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t('employee.validation.emailInvalid'),
  statusRequired: (v: string) => !!v || t('employee.validation.statusRequired'),
}

watch(
  () => props.modelValue,
  async open => {
    if (!open) return
    errorMessage.value = ''
    loading.value = true
    try {
      const employee =
        props.mode === 'edit' && props.employeeId != null
          ? await getEmployee(props.employeeId)
          : null

      if (props.mode === 'create') {
        form.username = ''
        form.password = ''
        form.email = ''
        form.nickname = ''
        form.mobile = ''
        form.sex = ''
        form.hiredDate = ''
        form.status = ''
        form.roleIds = []
        form.remark = ''
        version.value = 0
        formRef.value?.resetValidation()
      } else if (employee) {
        form.username = employee.username
        form.password = ''
        form.email = employee.email ?? ''
        form.nickname = employee.nickname ?? ''
        form.mobile = employee.mobile ?? ''
        form.sex = employee.sex === 0 ? 'MALE' : employee.sex === 1 ? 'FEMALE' : ''
        form.hiredDate = employee.hiredDate ?? ''
        form.status = employee.status
        form.roleIds = [...(employee.roleIds ?? [])]
        form.remark = employee.remark ?? ''
        version.value = employee.version ?? 0
      }
    } catch (error: unknown) {
      errorMessage.value = error instanceof Error ? error.message : t('employee.error.loadFailed')
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
      ? createEmployee({
          username: form.username,
          email: form.email,
          nickname: form.nickname,
          mobile: form.mobile || undefined,
          sex: (form.sex || undefined) as 'MALE' | 'FEMALE' | undefined,
          hiredDate: form.hiredDate || undefined,
          roleIds: form.roleIds,
          remark: form.remark || undefined,
        })
      : updateEmployee({
          id: props.employeeId!,
          version: version.value,
          password: form.password || undefined,
          email: form.email || undefined,
          status: form.status,
          nickname: form.nickname || undefined,
          mobile: form.mobile || undefined,
          sex: (form.sex || undefined) as 'MALE' | 'FEMALE' | undefined,
          hiredDate: form.hiredDate || undefined,
          roleIds: form.roleIds,
          remark: form.remark || undefined,
        }))
    emit('saved')
    emit('update:modelValue', false)
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('employee.error.saveFailed')
  } finally {
    submitting.value = false
  }
}
</script>
