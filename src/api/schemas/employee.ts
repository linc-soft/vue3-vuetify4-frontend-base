import { z } from 'zod/v4'

// ─── Enums ───

export const SexTypeSchema = z.enum(['MALE', 'FEMALE'])

// ─── Request ───

export const EmployeeCreateRequestSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Email must be a valid email address'),
  nickname: z.string().min(1, 'Nickname is required'),
  mobile: z.string().optional(),
  sex: SexTypeSchema.optional(),
  hiredDate: z.string().optional(),
  roleIds: z.array(z.number()).optional(),
  remark: z.string().optional(),
})

export const EmployeeUpdateRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  status: z.string().optional(),
  nickname: z.string().optional(),
  mobile: z.string().optional(),
  sex: SexTypeSchema.optional(),
  hiredDate: z.string().optional(),
  roleIds: z.array(z.number()).optional(),
  remark: z.string().optional(),
})

export const EmployeePageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1),
  keyword: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

// ─── Response ───

export const EmployeeResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().nullable(),
  status: z.string(),
  roleIds: z.array(z.number()).optional(),
  version: z.number().optional(),
  nickname: z.string().nullable(),
  mobile: z.string().nullable(),
  sex: z.number().nullable(),
  hiredDate: z.string().nullable(),
  remark: z.string().nullable(),
  totalAnnualDays: z.number().nullable(),
  usedAnnualDays: z.number().nullable(),
  remainAnnualDays: z.number().nullable(),
  otherLeaveDays: z.number().nullable(),
})

export const EmployeeListResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  nickname: z.string().nullable(),
  sex: z.number().nullable(),
  hiredDate: z.string().nullable(),
  status: z.string(),
  updateBy: z.string().nullable(),
  updateAt: z.string().nullable(),
  version: z.number().optional(),
  totalAnnualDays: z.number().nullable(),
  usedAnnualDays: z.number().nullable(),
  remainAnnualDays: z.number().nullable(),
  otherLeaveDays: z.number().nullable(),
})

// ─── Types ───

export type EmployeeCreateRequest = z.infer<typeof EmployeeCreateRequestSchema>
export type EmployeeUpdateRequest = z.infer<typeof EmployeeUpdateRequestSchema>
export type EmployeePageRequest = z.infer<typeof EmployeePageRequestSchema>
export type EmployeeResponse = z.infer<typeof EmployeeResponseSchema>
export type EmployeeListResponse = z.infer<typeof EmployeeListResponseSchema>
