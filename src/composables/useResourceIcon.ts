import { usePermissionStore } from '@/stores/permission'

export function useResourceIcon() {
  const store = usePermissionStore()

  return {
    iconOf: (code: string, fallback: string): string => store.iconOf(code) || fallback,
  }
}
