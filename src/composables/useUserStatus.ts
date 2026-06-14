import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEnums } from './useEnums'

/** i18n keys for user status display names. */
const STATUS_I18N_MAP: Record<string, string> = {
  '1': 'user.status.enabled',
  '0': 'user.status.disabled',
  '2': 'user.status.inactive',
}

/**
 * User status enum backed by the backend enum endpoint.
 *
 * The list is loaded once via `useEnums('user-status')` and display names are
 * resolved through vue-i18n so labels stay localized.
 */
export function useUserStatus() {
  const { t } = useI18n()
  const { items: enumItems } = useEnums('user-status')

  const items = computed(() =>
    enumItems.value.map(item => {
      const code = String(item.code)
      const i18nKey = STATUS_I18N_MAP[code]
      return {
        code,
        name: i18nKey ? t(i18nKey) : item.name,
      }
    }),
  )

  const options = computed(() => items.value.map(item => ({ title: item.name, value: item.code })))

  const labelOf = (code: string | number) =>
    items.value.find(i => i.code === String(code))?.name ?? String(code)

  return { items, options, labelOf }
}
