import { z } from 'zod/v4'

// ─── Request ───

export const DepartmentCreateRequestSchema = z.object({
  deptName: z.string().min(1).max(64),
  deptCode: z.string().max(64).optional(),
  parentId: z.number().optional(),
  leaderUserId: z.number().optional(),
  sortOrder: z.number().int().optional(),
  status: z.string().max(1).optional(),
})

export type DepartmentCreateRequest = z.infer<typeof DepartmentCreateRequestSchema>

export const DepartmentUpdateRequestSchema = z.object({
  id: z.number(),
  deptName: z.string().min(1).max(64),
  deptCode: z.string().max(64).optional(),
  parentId: z.number().optional(),
  leaderUserId: z.number().optional(),
  sortOrder: z.number().int().optional(),
  status: z.string().max(1).optional(),
  version: z.number(),
})

export type DepartmentUpdateRequest = z.infer<typeof DepartmentUpdateRequestSchema>

export const DepartmentDeleteRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
})

export type DepartmentDeleteRequest = z.infer<typeof DepartmentDeleteRequestSchema>

// ─── Response ───

export const DepartmentInfoResponseSchema = z.object({
  id: z.number(),
  deptName: z.string(),
  deptCode: z.string().nullable().optional(),
  parentId: z.number().nullable().optional(),
  leaderUserId: z.number().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  status: z.string(),
  version: z.number(),
})

export type DepartmentInfoResponse = z.infer<typeof DepartmentInfoResponseSchema>

// Tree node — recursive, each node carries its direct children.
export interface DepartmentTreeResponse {
  id: number
  deptName: string
  deptCode?: string | null
  parentId?: number | null
  leaderUserId?: number | null
  sortOrder?: number | null
  status: string
  version: number
  children?: DepartmentTreeResponse[]
}

export const DepartmentTreeResponseSchema: z.ZodType<DepartmentTreeResponse> = z.lazy(() =>
  z.object({
    id: z.number(),
    deptName: z.string(),
    deptCode: z.string().nullable().optional(),
    parentId: z.number().nullable().optional(),
    leaderUserId: z.number().nullable().optional(),
    sortOrder: z.number().nullable().optional(),
    status: z.string(),
    version: z.number(),
    children: z.array(DepartmentTreeResponseSchema).optional(),
  }),
)
