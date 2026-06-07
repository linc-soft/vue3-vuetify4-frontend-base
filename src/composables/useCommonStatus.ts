import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** Enabled / disabled status shared by department and position (0 disabled / 1 enabled). */
const COMMON_STATUS_I18N_MAP: Record<string, string> = {
  '1': 'oa.common.status.enabled',
  '0': 'oa.common.status.disabled',
}

/** Employment status used by employee (0 left / 1 active / 2 on leave). */
const EMPLOYEE_STATUS_I18N_MAP: Record<string, string> = {
  '1': 'oa.employee.status.active',
  '0': 'oa.employee.status.left',
  '2': 'oa.employee.status.onLeave',
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

/** Employment status options (employee). */
export function useEmployeeStatus() {
  return buildStatus(EMPLOYEE_STATUS_I18N_MAP)
}

/** Gender options (employee). */
export function useGender() {
  return buildStatus(GENDER_I18N_MAP)
}
