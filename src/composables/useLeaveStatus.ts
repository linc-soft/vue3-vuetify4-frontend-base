import { useEnums } from '@/composables/useEnums'

/**
 * Composable for leave status enum options.
 *
 * Uses the backend enum API to get leave status dropdown options.
 */
export function useLeaveStatus() {
  return useEnums('LeaveStatus')
}
