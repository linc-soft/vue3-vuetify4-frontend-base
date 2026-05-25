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
  password: z.string().min(1),
  status: z.string().min(1),
  roleIds: z.array(z.number()).optional(),
})

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>

export const UserUpdateRequestSchema = z.object({
  id: z.number(),
  username: z.string().min(1),
  password: z.string().optional(),
  status: z.string().min(1),
  roleIds: z.array(z.number()).optional(),
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
  status: z.string(),
  roleIds: z.array(z.number()).optional(),
  version: z.number(),
})

export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>

export const UserListResponseItemSchema = z.object({
  id: z.number(),
  username: z.string(),
  status: z.string(),
  updateBy: z.string().nullable(),
  updateAt: z.string().nullable(),
  version: z.number(),
})

export type UserListResponseItem = z.infer<typeof UserListResponseItemSchema>

export const UserPageResponseItemSchema = z.object({
  id: z.number(),
  username: z.string(),
  status: z.string(),
  updateBy: z.string().nullable(),
  updateAt: z.string().nullable(),
  version: z.number(),
})

export type UserPageResponseItem = z.infer<typeof UserPageResponseItemSchema>
