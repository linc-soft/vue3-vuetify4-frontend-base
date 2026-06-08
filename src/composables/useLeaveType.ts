import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** Leave type code → i18n key mapping (matches backend LeaveTypeEnum). */
const LEAVE_TYPE_I18N_MAP: Record<string, string> = {
  '1': 'leave.type.annual',
  '2': 'leave.type.sick',
  '3': 'leave.type.personal',
  '4': 'leave.type.marriage',
  '5': 'leave.type.maternity',
  '9': 'leave.type.other',
}

export function useLeaveType() {
  const { t } = useI18n()

  const options = computed(() =>
    Object.entries(LEAVE_TYPE_I18N_MAP).map(([value, key]) => ({ title: t(key), value })),
  )

  const labelOf = (code: string | number) => {
    const key = LEAVE_TYPE_I18N_MAP[String(code)]
    return key ? t(key) : String(code)
  }

  return { options, labelOf }
}
