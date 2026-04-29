import type { RoleListResponseItem } from '@/api/schemas/role'
import { computed, type Ref } from 'vue'

// ─── Types ───

/** Inheritance tree node */
export interface RoleTreeNode {
  id: number
  roleName: string
  roleCode: string | null
  children: RoleTreeNode[]
  depth: number
  isRedundant: boolean
}

// ─── Helper Functions ───

/**
 * Get all ancestor IDs of the specified role.
 * @param roleId Starting Role ID
 * @param allRoles All Role List
 * @returns Set of Ancestor IDs
 */
export function getAncestorIds(roleId: number, allRoles: RoleListResponseItem[]): Set<number> {
  const ancestors = new Set<number>()
  const queue: number[] = [roleId]
  const visited = new Set<number>()

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const role = allRoles.find(r => r.id === currentId)
    if (role?.parentRoleIds) {
      for (const parentId of role.parentRoleIds) {
        if (!ancestors.has(parentId)) {
          ancestors.add(parentId)
          queue.push(parentId)
        }
      }
    }
  }

  return ancestors
}

/**
 * Determine whether a cycle will occur when adding inheritance.
 * @param currentRoleId Editing Role ID (null when new)
 * @param candidateParentId Candidate Role ID for Inheritance Target
 * @param allRoles All Roles List
 * @returns Return true if a cycle occurs.
 */
export function wouldCreateCycle(
  currentRoleId: number | null,
  candidateParentId: number,
  allRoles: RoleListResponseItem[],
): boolean {
  if (currentRoleId === null) return false
  // If the candidate's ancestors include itself, a cycle occurs.
  const ancestorsOfCandidate = getAncestorIds(candidateParentId, allRoles)
  return ancestorsOfCandidate.has(currentRoleId)
}

/**
 * Calculate the role IDs to be disabled in the left list.
 * - Myself (the role being edited)
 * - Own Ancestors (Cycle Prevention)
 * - Own descendants (reverse cycle prevention)
 * @param currentRoleId Editing Role ID (null when creating new)
 * @param allRoles All Role List
 * @returns Set of role IDs to be disabled
 */
export function getDisabledRoleIds(
  currentRoleId: number | null,
  allRoles: RoleListResponseItem[],
): Set<number> {
  const disabled = new Set<number>()

  if (currentRoleId === null) return disabled

  // Disable itself
  disabled.add(currentRoleId)

  // Disable own ancestors (cycle prevention)
  const ancestors = getAncestorIds(currentRoleId, allRoles)
  for (const id of ancestors) {
    disabled.add(id)
  }

  // Disable own descendants (prevent reverse circular dependency)
  const descendants = getDescendantIds(currentRoleId, allRoles)
  for (const id of descendants) {
    disabled.add(id)
  }

  return disabled
}

/**
 * Get all descendant IDs of the specified role.
 * @param roleId Starting Role ID
 * @param allRoles Full Role List
 * @returns Set of Descendant IDs
 */
export function getDescendantIds(roleId: number, allRoles: RoleListResponseItem[]): Set<number> {
  const descendants = new Set<number>()

  // Build reverse lookup map: parentId -> childIds
  const childrenMap = new Map<number, number[]>()
  for (const role of allRoles) {
    if (role.parentRoleIds) {
      for (const parentId of role.parentRoleIds) {
        const children = childrenMap.get(parentId) ?? []
        children.push(role.id)
        childrenMap.set(parentId, children)
      }
    }
  }

  const queue: number[] = [roleId]
  const visited = new Set<number>()

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const children = childrenMap.get(currentId) ?? []
    for (const childId of children) {
      if (!descendants.has(childId)) {
        descendants.add(childId)
        queue.push(childId)
      }
    }
  }

  return descendants
}

/**
 * Construct the inheritance tree
 * @param selectedParentIds Selected Parent Role ID List
 * @param allRoles Full Role List
 * @returns Tree root node array
 */
export function buildInheritanceTree(
  selectedParentIds: number[],
  allRoles: RoleListResponseItem[],
): RoleTreeNode[] {
  if (selectedParentIds.length === 0) return []

  const redundantIds = getRedundantRoleIds(selectedParentIds, allRoles)

  // Recursively build the tree
  function buildNode(roleId: number, depth: number, visited: Set<number>): RoleTreeNode | null {
    if (visited.has(roleId)) return null // Cycle Prevention
    visited.add(roleId)

    const role = allRoles.find(r => r.id === roleId)
    if (!role) return null

    const children: RoleTreeNode[] = []
    if (role.parentRoleIds) {
      for (const parentId of role.parentRoleIds) {
        const node = buildNode(parentId, depth + 1, new Set(visited))
        if (node) children.push(node)
      }
    }

    return {
      id: role.id,
      roleName: role.roleName,
      roleCode: role.roleCode,
      children,
      depth,
      isRedundant: redundantIds.has(roleId),
    }
  }

  const roots: RoleTreeNode[] = []
  for (const parentId of selectedParentIds) {
    const node = buildNode(parentId, 0, new Set())
    if (node) roots.push(node)
  }

  return roots
}

/**
 * Detect redundant inheritance (roles already inherited indirectly)
 * @param selectedParentIds Selected Parent Role ID List
 * @param allRoles Full list of roles
 * @returns Set of redundant role IDs
 */
export function getRedundantRoleIds(
  selectedParentIds: number[],
  allRoles: RoleListResponseItem[],
): Set<number> {
  const redundant = new Set<number>()

  // Collect the ancestors of each selected parent.
  for (const parentId of selectedParentIds) {
    const ancestors = getAncestorIds(parentId, allRoles)
    // If any other selected parent is included in the ancestors of this parent, it is redundant.
    for (const otherParentId of selectedParentIds) {
      if (otherParentId !== parentId && ancestors.has(otherParentId)) {
        redundant.add(otherParentId)
      }
    }
  }

  return redundant
}

// ─── Composable ───

/**
 * Role Inheritance Calculation Composable
 * @param allRoles Ref of full role list
 * @param currentRoleId Ref of the editing role ID (null when creating a new one)
 * @param selectedParentIds Ref of Selected Parent Role IDs
 */
export function useRoleInheritance(
  allRoles: Ref<RoleListResponseItem[]>,
  currentRoleId: Ref<number | null>,
  selectedParentIds: Ref<number[]>,
) {
  /** Role IDs to be invalidated */
  const disabledIds = computed(() => getDisabledRoleIds(currentRoleId.value, allRoles.value))

  /** Inheritance Tree */
  const inheritanceTree = computed(() =>
    buildInheritanceTree(selectedParentIds.value, allRoles.value),
  )

  /** Redundant role IDs */
  const redundantIds = computed(() => getRedundantRoleIds(selectedParentIds.value, allRoles.value))

  /** Filtered role list for the left list (excluding self) */
  const availableRoles = computed(() => {
    const currentId = currentRoleId.value
    return allRoles.value.filter(r => r.id !== currentId)
  })

  return {
    disabledIds,
    inheritanceTree,
    redundantIds,
    availableRoles,
  }
}
