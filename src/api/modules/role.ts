import type { Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type RoleCreateRequest,
  type RoleDeleteRequest,
  type RoleInfoResponse,
  RoleInfoResponseSchema,
  type RoleListRequest,
  type RoleListResponseItem,
  RoleListResponseItemSchema,
  type RoleUpdateRequest,
} from '@/api/schemas/role'

/** GET /api/master/roles/{id} */
export async function getRole(id: number): Promise<RoleInfoResponse> {
  const { data } = await http.get<Result<RoleInfoResponse>>(`/api/master/roles/${id}`)
  return RoleInfoResponseSchema.parse(data.data)
}

/** GET /api/master/roles */
export async function getRoleList(params?: RoleListRequest): Promise<RoleListResponseItem[]> {
  const { data } = await http.get<Result<RoleListResponseItem[]>>('/api/master/roles', { params })
  return z.array(RoleListResponseItemSchema).parse(data.data)
}

/** POST /api/master/roles */
export async function createRole(params: RoleCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/master/roles', params)
  return data.data
}

/** PUT /api/master/roles */
export async function updateRole(params: RoleUpdateRequest): Promise<void> {
  await http.put('/api/master/roles', params)
}

/** DELETE /api/master/roles */
export async function deleteRole(params: RoleDeleteRequest): Promise<void> {
  await http.delete('/api/master/roles', { data: params })
}
