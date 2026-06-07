import { z } from 'zod/v4'

// ─── Request ───

export const EmployeePageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1),
  realName: z.string().optional(),
  employeeNo: z.string().optional(),
  deptId: z.number().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

export type EmployeePageRequest = z.infer<typeof EmployeePageRequestSchema>

export const EmployeeCreateRequestSchema = z.object({
  username: z.string().min(1).max(64),
  employeeNo: z.string().max(32).optional(),
  realName: z.string().min(1).max(64),
  deptId: z.number().optional(),
  positionId: z.number().optional(),
  managerId: z.number().optional(),
  mobile: z.string().max(20).optional(),
  email: z.string().email().max(128),
  gender: z.string().max(1).optional(),
  idCardNo: z.string().max(32).optional(),
  birthday: z.string().optional(),
  hireDate: z.string().optional(),
  status: z.string().max(1).optional(),
  roleIds: z.array(z.number()).optional(),
})

export type EmployeeCreateRequest = z.infer<typeof EmployeeCreateRequestSchema>

export const EmployeeUpdateRequestSchema = z.object({
  id: z.number(),
  employeeNo: z.string().max(32).optional(),
  realName: z.string().min(1).max(64),
  deptId: z.number().optional(),
  positionId: z.number().optional(),
  managerId: z.number().optional(),
  mobile: z.string().max(20).optional(),
  email: z.string().email().max(128).optional(),
  gender: z.string().max(1).optional(),
  idCardNo: z.string().max(32).optional(),
  birthday: z.string().optional(),
  hireDate: z.string().optional(),
  status: z.string().max(1).optional(),
  version: z.number(),
})

export type EmployeeUpdateRequest = z.infer<typeof EmployeeUpdateRequestSchema>

export const EmployeeDeleteRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
})

export type EmployeeDeleteRequest = z.infer<typeof EmployeeDeleteRequestSchema>

// ─── Response ───

export const EmployeeInfoResponseSchema = z.object({
  id: z.number(),
  userId: z.number().nullable().optional(),
  employeeNo: z.string().nullable().optional(),
  realName: z.string(),
  deptId: z.number().nullable().optional(),
  positionId: z.number().nullable().optional(),
  managerId: z.number().nullable().optional(),
  mobile: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  idCardNo: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  status: z.string(),
  version: z.number(),
})

export type EmployeeInfoResponse = z.infer<typeof EmployeeInfoResponseSchema>

export const EmployeePageResponseItemSchema = z.object({
  id: z.number(),
  userId: z.number().nullable().optional(),
  employeeNo: z.string().nullable().optional(),
  realName: z.string(),
  deptId: z.number().nullable().optional(),
  positionId: z.number().nullable().optional(),
  mobile: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  status: z.string(),
  version: z.number(),
})

export type EmployeePageResponseItem = z.infer<typeof EmployeePageResponseItemSchema>
