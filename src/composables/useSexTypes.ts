import { useEnums } from '@/composables/useEnums'

/**
 * Composable for sex type enum options.
 *
 * Uses the backend enum API to get gender dropdown options.
 */
export function useSexTypes() {
  return useEnums('SexType')
}
