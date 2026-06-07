import type { Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type DepartmentCreateRequest,
  type DepartmentDeleteRequest,
  type DepartmentInfoResponse,
  DepartmentInfoResponseSchema,
  type DepartmentTreeResponse,
  DepartmentTreeResponseSchema,
  type DepartmentUpdateRequest,
} from '@/api/schemas/department'

/** GET /api/departments/{id} */
export async function getDepartment(id: number): Promise<DepartmentInfoResponse> {
  const { data } = await http.get<Result<DepartmentInfoResponse>>(`/api/departments/${id}`)
  return DepartmentInfoResponseSchema.parse(data.data)
}

/** GET /api/departments/tree */
export async function getDepartmentTree(): Promise<DepartmentTreeResponse[]> {
  const { data } = await http.get<Result<DepartmentTreeResponse[]>>('/api/departments/tree')
  return z.array(DepartmentTreeResponseSchema).parse(data.data)
}

/** POST /api/departments */
export async function createDepartment(params: DepartmentCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/departments', params)
  return data.data
}

/** PUT /api/departments */
export async function updateDepartment(params: DepartmentUpdateRequest): Promise<void> {
  await http.put('/api/departments', params)
}

/** DELETE /api/departments */
export async function deleteDepartment(params: DepartmentDeleteRequest): Promise<void> {
  await http.delete('/api/departments', { data: params })
}
