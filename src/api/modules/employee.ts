import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type EmployeeListResponse,
  EmployeeListResponseSchema,
  type EmployeePageRequest,
  type EmployeeResponse,
  EmployeeResponseSchema,
  type SaveEmployeeRequest,
} from '@/api/schemas/employee'

/** GET /api/employees/{id} — Get employee by ID */
export async function getEmployee(id: number): Promise<EmployeeResponse> {
  const { data } = await http.get<Result<EmployeeResponse>>(`/api/employees/${id}`)
  return EmployeeResponseSchema.parse(data.data)
}

/** GET /api/employees — Get employee list */
export async function getEmployeeList(
  params?: Record<string, string | undefined>,
): Promise<EmployeeListResponse[]> {
  const { data } = await http.get<Result<EmployeeListResponse[]>>('/api/employees', { params })
  return z.array(EmployeeListResponseSchema).parse(data.data)
}

/** GET /api/employees/page — Paginated employee list */
export async function getEmployeePage(
  params: EmployeePageRequest,
): Promise<Page<EmployeeListResponse>> {
  const { data } = await http.get<Result<Page<EmployeeListResponse>>>('/api/employees/page', {
    params,
  })
  data.data.records = z.array(EmployeeListResponseSchema).parse(data.data.records)
  return data.data
}

/** POST /api/employees — Create employee */
export async function createEmployee(params: SaveEmployeeRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/employees', params)
  return data.data
}

/** PUT /api/employees — Update employee */
export async function updateEmployee(params: SaveEmployeeRequest): Promise<void> {
  await http.put('/api/employees', params)
}

/** DELETE /api/employees — Delete employee */
export async function deleteEmployee(id: number): Promise<void> {
  await http.delete('/api/employees', { params: { id } })
}
