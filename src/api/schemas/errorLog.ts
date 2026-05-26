import { z } from 'zod/v4'

// ─── Request ───

export const ErrorLogPageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1).max(100),
  traceId: z.string().optional(),
  keyword: z.string().optional(),
  username: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

export type ErrorLogPageRequest = z.infer<typeof ErrorLogPageRequestSchema>

// ─── Response ───

export const ErrorLogPageItemSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  errorType: z.string(),
  message: z.string(),
  username: z.string().nullish(),
  createdAt: z.string(),
})

export type ErrorLogPageItem = z.infer<typeof ErrorLogPageItemSchema>

export const ErrorLogDetailSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  errorType: z.string(),
  message: z.string(),
  stackTrace: z.string(),
  username: z.string().nullish(),
  requestMethod: z.string().nullish(),
  requestPath: z.string().nullish(),
  requestBody: z.string().nullish(),
  createdAt: z.string(),
})

export type ErrorLogDetail = z.infer<typeof ErrorLogDetailSchema>
