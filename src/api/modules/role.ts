import type { Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import { type DownloadResult, parseFilenameFromContentDisposition } from '@/api/download'
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

/** GET /api/pdf/roles - Generate role list PDF */
export async function generateRoleListPdf(params?: RoleListRequest): Promise<DownloadResult> {
  const response = await http.get<Blob>('/api/pdf/roles', {
    params,
    responseType: 'blob',
  })
  return {
    blob: response.data,
    filename: parseFilenameFromContentDisposition(response.headers['content-disposition']),
  }
}

/** GET /api/pdf/roles/{id} - Generate role detail PDF */
export async function generateRoleInfoPdf(id: number): Promise<DownloadResult> {
  const response = await http.get<Blob>(`/api/pdf/roles/${id}`, {
    responseType: 'blob',
  })
  return {
    blob: response.data,
    filename: parseFilenameFromContentDisposition(response.headers['content-disposition']),
  }
}
