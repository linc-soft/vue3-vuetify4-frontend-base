import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const PERIOD_I18N_MAP: Record<string, string> = {
  '0': 'leave.submit.am',
  '1': 'leave.submit.pm',
}

export function usePeriodType() {
  const { t } = useI18n()

  const options = computed(() =>
    Object.entries(PERIOD_I18N_MAP).map(([value, key]) => ({ title: t(key), value })),
  )

  const labelOf = (code: string | number) => {
    const key = PERIOD_I18N_MAP[String(code)]
    return key ? t(key) : String(code)
  }

  return { options, labelOf }
}
