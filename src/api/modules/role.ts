import type { Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type RoleCreateRequest,
  type RoleDeleteRequest,
  type RoleInfoResponse,
  RoleInfoResponseSchema,
  type RoleInheritanceRequest,
  type RoleListRequest,
  type RoleListResponseItem,
  RoleListResponseItemSchema,
  type RoleUpdateRequest,
} from '@/api/schemas/role'

/** GET /api/roles/{id} */
export async function getRole(id: number): Promise<RoleInfoResponse> {
  const { data } = await http.get<Result<RoleInfoResponse>>(`/api/roles/${id}`)
  return RoleInfoResponseSchema.parse(data.data)
}

/** GET /api/roles */
export async function getRoleList(params?: RoleListRequest): Promise<RoleListResponseItem[]> {
  const { data } = await http.get<Result<RoleListResponseItem[]>>('/api/roles', { params })
  return z.array(RoleListResponseItemSchema).parse(data.data)
}

/** POST /api/roles */
export async function createRole(params: RoleCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/roles', params)
  return data.data
}

/** PUT /api/roles */
export async function updateRole(params: RoleUpdateRequest): Promise<void> {
  await http.put('/api/roles', params)
}

/** DELETE /api/roles */
export async function deleteRole(params: RoleDeleteRequest): Promise<void> {
  await http.delete('/api/roles', { data: params })
}

// ========== Role Inheritance API ==========

/** POST /api/roles/inheritance — Add Role Inheritance Relationship */
export async function addRoleInheritance(params: RoleInheritanceRequest): Promise<void> {
  await http.post('/api/roles/inheritance', params)
}

/** DELETE /api/roles/inheritance — Delete Role Inheritance Relationship */
export async function removeRoleInheritance(params: RoleInheritanceRequest): Promise<void> {
  await http.delete('/api/roles/inheritance', { data: params })
}

/** GET /api/roles/{id}/parents — Get parent role list */
export async function getParentRoles(id: number): Promise<RoleListResponseItem[]> {
  const { data } = await http.get<Result<RoleListResponseItem[]>>(`/api/roles/${id}/parents`)
  return z.array(RoleListResponseItemSchema).parse(data.data)
}

/** GET /api/roles/{id}/children — Get child role list */
export async function getChildRoles(id: number): Promise<RoleListResponseItem[]> {
  const { data } = await http.get<Result<RoleListResponseItem[]>>(`/api/roles/${id}/children`)
  return z.array(RoleListResponseItemSchema).parse(data.data)
}
