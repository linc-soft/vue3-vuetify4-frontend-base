import { z } from 'zod/v4'

// ─── Request ───

export const RoleListRequestSchema = z.object({
  roleName: z.string().optional(),
  roleCode: z.string().optional(),
})

export type RoleListRequest = z.infer<typeof RoleListRequestSchema>

export const RoleCreateRequestSchema = z.object({
  roleName: z.string().min(1),
  description: z.string().optional(),
  parentRoleIds: z.array(z.number()).default([]),
})

export type RoleCreateRequest = z.infer<typeof RoleCreateRequestSchema>

export const RoleUpdateRequestSchema = z.object({
  id: z.number(),
  roleName: z.string().min(1),
  description: z.string().optional(),
  version: z.number(),
  parentRoleIds: z.array(z.number()).default([]),
})

export type RoleUpdateRequest = z.infer<typeof RoleUpdateRequestSchema>

export const RoleDeleteRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
})

export type RoleDeleteRequest = z.infer<typeof RoleDeleteRequestSchema>

// ─── Response ───

export const RoleInfoResponseSchema = z.object({
  id: z.number(),
  roleName: z.string(),
  roleCode: z.string().nullable(),
  description: z.string().nullable(),
  version: z.number(),
  parentRoleIds: z.array(z.number()).default([]),
})

export type RoleInfoResponse = z.infer<typeof RoleInfoResponseSchema>

export const RoleListResponseItemSchema = z.object({
  id: z.number(),
  roleName: z.string(),
  roleCode: z.string().nullable(),
  description: z.string().nullable(),
  updateBy: z.string().nullable(),
  updateAt: z.string().nullable(),
  parentRoleIds: z.array(z.number()).default([]),
  version: z.number(),
})

export type RoleListResponseItem = z.infer<typeof RoleListResponseItemSchema>
