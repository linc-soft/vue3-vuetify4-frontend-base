import { z } from 'zod/v4'

export const ResourceTypeSchema = z.union([z.literal(0), z.literal(1), z.literal(2)])

export type ResourceType = z.infer<typeof ResourceTypeSchema>

export interface ResourceNode {
  id: number
  resourceCode: string
  resourceName: string
  type: ResourceType
  parentId: number
  routePath: string | null
  icon: string | null
  sortOrder: number | null
  roleCode: string | null
  status: string | null
  children: ResourceNode[]
}

export const ResourceNodeSchema: z.ZodType<ResourceNode> = z.lazy(() =>
  z.object({
    id: z.number(),
    resourceCode: z.string(),
    resourceName: z.string(),
    type: ResourceTypeSchema,
    parentId: z.number(),
    routePath: z.string().nullable(),
    icon: z.string().nullable(),
    sortOrder: z.number().nullable(),
    roleCode: z.string().nullable(),
    status: z.string().nullable(),
    children: z.array(ResourceNodeSchema),
  }),
)

export const ResourceTreeSchema = z.array(ResourceNodeSchema)

export const ResourceInfoResponseSchema = z.object({
  id: z.number(),
  resourceCode: z.string(),
  resourceName: z.string(),
  type: ResourceTypeSchema,
  parentId: z
    .number()
    .nullable()
    .transform(value => value ?? 0),
  routePath: z.string().nullable(),
  icon: z.string().nullable(),
  sortOrder: z.number().nullable(),
  roleCode: z.string().nullable(),
  status: z
    .string()
    .nullable()
    .transform(value => value ?? '1'),
  version: z.number(),
})

export type ResourceInfoResponse = z.infer<typeof ResourceInfoResponseSchema>

export const ResourceCreateRequestSchema = z.object({
  resourceCode: z.string().min(1).max(128),
  resourceName: z.string().min(1).max(128),
  type: ResourceTypeSchema,
  parentId: z.number(),
  routePath: z.string().max(255).nullable().optional(),
  icon: z.string().max(64).nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  roleCode: z.string().max(64).nullable().optional(),
  status: z.string().max(1).nullable().optional(),
})

export type ResourceCreateRequest = z.infer<typeof ResourceCreateRequestSchema>

export const ResourceUpdateRequestSchema = ResourceCreateRequestSchema.extend({
  id: z.number(),
  version: z.number(),
})

export type ResourceUpdateRequest = z.infer<typeof ResourceUpdateRequestSchema>

export const ResourceDeleteRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
})

export type ResourceDeleteRequest = z.infer<typeof ResourceDeleteRequestSchema>
