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

/** GET /api/master/departments/{id} */
export async function getDepartment(id: number): Promise<DepartmentInfoResponse> {
  const { data } = await http.get<Result<DepartmentInfoResponse>>(`/api/master/departments/${id}`)
  return DepartmentInfoResponseSchema.parse(data.data)
}

/** GET /api/master/departments/tree */
export async function getDepartmentTree(): Promise<DepartmentTreeResponse[]> {
  const { data } = await http.get<Result<DepartmentTreeResponse[]>>('/api/master/departments/tree')
  return z.array(DepartmentTreeResponseSchema).parse(data.data)
}

/** POST /api/master/departments */
export async function createDepartment(params: DepartmentCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/master/departments', params)
  return data.data
}

/** PUT /api/master/departments */
export async function updateDepartment(params: DepartmentUpdateRequest): Promise<void> {
  await http.put('/api/master/departments', params)
}

/** DELETE /api/master/departments */
export async function deleteDepartment(params: DepartmentDeleteRequest): Promise<void> {
  await http.delete('/api/master/departments', { data: params })
}
