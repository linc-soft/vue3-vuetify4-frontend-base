import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const STATUS_I18N_MAP: Record<string, string> = {
  '1': 'user.status.enabled',
  '0': 'user.status.disabled',
  '2': 'user.status.inactive',
}

export function useUserStatus() {
  const { t } = useI18n()

  const items = computed(() =>
    Object.entries(STATUS_I18N_MAP).map(([code, key]) => ({
      code,
      name: t(key),
    })),
  )

  const options = computed(() =>
    Object.entries(STATUS_I18N_MAP).map(([value, key]) => ({
      title: t(key),
      value,
    })),
  )

  const labelOf = (code: string | number) => {
    const key = STATUS_I18N_MAP[String(code)]
    return key ? t(key) : String(code)
  }

  return { items, options, labelOf }
}
