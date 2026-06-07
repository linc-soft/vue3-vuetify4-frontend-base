import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** Leave request status (0 pending / 1 approved / 2 rejected / 3 withdrawn). */
const LEAVE_STATUS_I18N_MAP: Record<string, string> = {
  '0': 'leave.status.pending',
  '1': 'leave.status.approved',
  '2': 'leave.status.rejected',
  '3': 'leave.status.withdrawn',
}

/** Vuetify chip colors per leave status. */
const LEAVE_STATUS_COLOR_MAP: Record<string, string> = {
  '0': 'warning',
  '1': 'success',
  '2': 'error',
  '3': 'grey',
}

export function useLeaveStatus() {
  const { t } = useI18n()

  const options = computed(() =>
    Object.entries(LEAVE_STATUS_I18N_MAP).map(([value, key]) => ({ title: t(key), value })),
  )

  const labelOf = (code: string | number) => {
    const key = LEAVE_STATUS_I18N_MAP[String(code)]
    return key ? t(key) : String(code)
  }

  const colorOf = (code: string | number) => LEAVE_STATUS_COLOR_MAP[String(code)] ?? 'grey'

  return { options, labelOf, colorOf }
}
