import { useI18n } from 'vue-i18n'

interface RoleDisplayInput {
  roleName: string
  roleCode: string | null
}

/**
 * Resolve a role's display name with i18n support.
 *
 * Base roles carry a `roleCode` (e.g. `LIST_LOG`) that maps to locale keys under
 * `common.enums.role-code.<normalized-code>`. Composite roles only have a user-defined
 * `roleName`, which is returned as-is.
 */
export function useRoleDisplay() {
  const { t, te } = useI18n()

  function displayName(role: RoleDisplayInput | null | undefined): string {
    if (!role) return ''
    if (!role.roleCode) return role.roleName

    const key = `common.enums.role-code.${role.roleCode.toLowerCase().replace(/_/g, '-')}`
    return te(key) ? t(key) : role.roleName
  }

  return { displayName }
}
