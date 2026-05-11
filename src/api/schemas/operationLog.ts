import { z } from 'zod/v4'

// ─── Enums ───

export const OperationTypeSchema = z.enum(['CREATE', 'UPDATE', 'DELETE'])

export type OperationType = z.infer<typeof OperationTypeSchema>

// ─── Request ───

export const OperationLogPageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1).max(100),
  traceId: z.string().optional(),
  operationType: OperationTypeSchema.optional(),
  targetType: z.string().optional(),
  username: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export type OperationLogPageRequest = z.infer<typeof OperationLogPageRequestSchema>

// ─── Response ───

export const OperationLogPageItemSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  operationType: OperationTypeSchema,
  targetType: z.string().nullish(),
  targetId: z.number().int().nullish(),
  summary: z.string().nullish(),
  username: z.string().nullish(),
  createdAt: z.string(),
})

export type OperationLogPageItem = z.infer<typeof OperationLogPageItemSchema>

export const OperationLogDetailSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  operationType: OperationTypeSchema,
  targetType: z.string().nullish(),
  targetId: z.number().int().nullish(),
  summary: z.string().nullish(),
  beforeData: z.string().nullish(),
  afterData: z.string().nullish(),
  diff: z.string().nullish(),
  username: z.string().nullish(),
  createdAt: z.string(),
})

export type OperationLogDetail = z.infer<typeof OperationLogDetailSchema>
