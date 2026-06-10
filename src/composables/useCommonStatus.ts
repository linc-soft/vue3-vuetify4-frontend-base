import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** Enabled / disabled status shared by department and position (0 disabled / 1 enabled). */
const COMMON_STATUS_I18N_MAP: Record<string, string> = {
  '1': 'oa.common.status.enabled',
  '0': 'oa.common.status.disabled',
}

/** Gender used by employee (0 unknown / 1 male / 2 female). */
const GENDER_I18N_MAP: Record<string, string> = {
  '0': 'oa.employee.gender.unknown',
  '1': 'oa.employee.gender.male',
  '2': 'oa.employee.gender.female',
}

function buildStatus(map: Record<string, string>) {
  const { t } = useI18n()

  const items = computed(() => Object.entries(map).map(([code, key]) => ({ code, name: t(key) })))

  const options = computed(() =>
    Object.entries(map).map(([value, key]) => ({ title: t(key), value })),
  )

  const labelOf = (code: string | number) => {
    const key = map[String(code)]
    return key ? t(key) : String(code)
  }

  return { items, options, labelOf }
}

/** Enabled/disabled status options (department, position). */
export function useCommonStatus() {
  return buildStatus(COMMON_STATUS_I18N_MAP)
}

/** Gender options (employee). */
export function useGender() {
  return buildStatus(GENDER_I18N_MAP)
}
