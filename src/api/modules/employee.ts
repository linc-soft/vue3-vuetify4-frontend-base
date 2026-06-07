import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type EmployeeCreateRequest,
  type EmployeeDeleteRequest,
  type EmployeeInfoResponse,
  EmployeeInfoResponseSchema,
  type EmployeePageRequest,
  type EmployeePageResponseItem,
  EmployeePageResponseItemSchema,
  type EmployeeUpdateRequest,
} from '@/api/schemas/employee'

/** GET /api/employees/{id} */
export async function getEmployee(id: number): Promise<EmployeeInfoResponse> {
  const { data } = await http.get<Result<EmployeeInfoResponse>>(`/api/employees/${id}`)
  return EmployeeInfoResponseSchema.parse(data.data)
}

/** GET /api/employees/page */
export async function getEmployeePage(
  params: EmployeePageRequest,
): Promise<Page<EmployeePageResponseItem>> {
  const { data } = await http.get<Result<Page<EmployeePageResponseItem>>>('/api/employees/page', {
    params,
  })
  // Validate each item in the records array.
  data.data.records = z.array(EmployeePageResponseItemSchema).parse(data.data.records)
  return data.data
}

/** POST /api/employees */
export async function createEmployee(params: EmployeeCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/employees', params)
  return data.data
}

/** PUT /api/employees */
export async function updateEmployee(params: EmployeeUpdateRequest): Promise<void> {
  await http.put('/api/employees', params)
}

/** DELETE /api/employees */
export async function deleteEmployee(params: EmployeeDeleteRequest): Promise<void> {
  await http.delete('/api/employees', { data: params })
}
