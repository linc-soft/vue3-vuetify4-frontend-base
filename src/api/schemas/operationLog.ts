import { z } from 'zod/v4'

// ─── Enums ───

export const OperationTypeSchema = z.enum(['CREATE', 'UPDATE', 'DELETE', 'OTHER'])

export type OperationType = z.infer<typeof OperationTypeSchema>

// ─── Request ───

export const OperationLogPageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1).max(100),
  traceId: z.string().optional(),
  operationType: OperationTypeSchema.optional(),
  module: z.string().optional(),
  username: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export type OperationLogPageRequest = z.infer<typeof OperationLogPageRequestSchema>

// ─── Response ───

export const OperationLogPageItemSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  module: z.string().nullable(),
  subModule: z.string().nullable(),
  operationType: OperationTypeSchema.nullable(),
  description: z.string().nullable(),
  duration: z.number().int().nullable(),
  username: z.string().nullable(),
  createdAt: z.string(),
})

export type OperationLogPageItem = z.infer<typeof OperationLogPageItemSchema>

export const OperationLogDetailSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  module: z.string().nullable(),
  subModule: z.string().nullable(),
  operationType: OperationTypeSchema.nullable(),
  description: z.string().nullable(),
  duration: z.number().int().nullable(),
  requestMethod: z.string().nullable(),
  requestUrl: z.string().nullable(),
  clientIp: z.string().nullable(),
  username: z.string().nullable(),
  createdAt: z.string(),
})

export type OperationLogDetail = z.infer<typeof OperationLogDetailSchema>
