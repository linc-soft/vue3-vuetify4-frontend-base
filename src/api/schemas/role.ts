import { z } from 'zod/v4'

// ─── Request ───

export const RoleListRequestSchema = z.object({
  roleName: z.string().optional(),
  roleCode: z.string().optional(),
  description: z.string().optional(),
})

export type RoleListRequest = z.infer<typeof RoleListRequestSchema>

export const RoleCreateRequestSchema = z.object({
  roleName: z.string().min(1),
  description: z.string().optional(),
})

export type RoleCreateRequest = z.infer<typeof RoleCreateRequestSchema>

export const RoleUpdateRequestSchema = z.object({
  id: z.number(),
  roleName: z.string().min(1),
  description: z.string().optional(),
  version: z.number(),
})

export type RoleUpdateRequest = z.infer<typeof RoleUpdateRequestSchema>

export const RoleDeleteRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
})

export type RoleDeleteRequest = z.infer<typeof RoleDeleteRequestSchema>

export const RoleInheritanceRequestSchema = z.object({
  childRoleId: z.number(),
  parentRoleId: z.number(),
})

export type RoleInheritanceRequest = z.infer<typeof RoleInheritanceRequestSchema>

// ─── Response ───

export const RoleInfoResponseSchema = z.object({
  id: z.number(),
  roleName: z.string(),
  roleCode: z.string().nullable(),
  description: z.string().nullable(),
  version: z.number(),
})

export type RoleInfoResponse = z.infer<typeof RoleInfoResponseSchema>

export const RoleListResponseItemSchema = z.object({
  id: z.number(),
  roleName: z.string(),
  roleCode: z.string().nullable(),
  description: z.string().nullable(),
  parentRoleIds: z.array(z.number()).nullable(),
  updateBy: z.string().nullable(),
  updateAt: z.string().nullable(),
})

export type RoleListResponseItem = z.infer<typeof RoleListResponseItemSchema>
