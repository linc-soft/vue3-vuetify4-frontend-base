import { useEnums } from '@/composables/useEnums'

/**
 * Composable for leave type enum options.
 *
 * Uses the backend enum API to get leave type dropdown options.
 */
export function useLeaveTypes() {
  return useEnums('LeaveType')
}
