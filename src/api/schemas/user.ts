import { z } from 'zod/v4'

// ─── Request ───

export const UserListRequestSchema = z.object({
  username: z.string().optional(),
  status: z.string().optional(),
})

export type UserListRequest = z.infer<typeof UserListRequestSchema>

export const UserPageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1),
  username: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

export type UserPageRequest = z.infer<typeof UserPageRequestSchema>

export const UserCreateRequestSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  status: z.string().min(1).optional(),
  roleIds: z.array(z.number()).optional(),
  realName: z.string().optional(),
  deptId: z.number().optional(),
  positionId: z.number().optional(),
  mobile: z.string().optional(),
  gender: z.string().optional(),
  birthday: z.string().optional(),
})

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>

export const UserUpdateRequestSchema = z.object({
  id: z.number(),
  username: z.string().min(1),
  password: z.string().optional(),
  email: z.string().email().optional(),
  status: z.string().min(1),
  roleIds: z.array(z.number()).optional(),
  realName: z.string().optional(),
  deptId: z.number().optional(),
  positionId: z.number().optional(),
  mobile: z.string().optional(),
  gender: z.string().optional(),
  birthday: z.string().optional(),
  version: z.number(),
})

export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>

export const UserDeleteRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
})

export type UserDeleteRequest = z.infer<typeof UserDeleteRequestSchema>

// ─── Response ───

export const UserInfoResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().nullable().optional(),
  status: z.string(),
  roleIds: z.array(z.number()).optional(),
  realName: z.string().nullable().optional(),
  deptId: z.number().nullable().optional(),
  positionId: z.number().nullable().optional(),
  mobile: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  version: z.number(),
})

export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>

export const UserListResponseItemSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().nullable().optional(),
  status: z.string(),
  realName: z.string().nullable().optional(),
  deptId: z.number().nullable().optional(),
  positionId: z.number().nullable().optional(),
  mobile: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  updateBy: z.string().nullable(),
  updateAt: z.string().nullable(),
  version: z.number(),
})

export type UserListResponseItem = z.infer<typeof UserListResponseItemSchema>

export const UserPageResponseItemSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().nullable().optional(),
  status: z.string(),
  realName: z.string().nullable().optional(),
  deptId: z.number().nullable().optional(),
  positionId: z.number().nullable().optional(),
  mobile: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  updateBy: z.string().nullable(),
  updateAt: z.string().nullable(),
  version: z.number(),
})

export type UserPageResponseItem = z.infer<typeof UserPageResponseItemSchema>
