import { z } from 'zod/v4'

// ─── Request ───

export const AccessLogPageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1).max(100),
  traceId: z.string().optional(),
  username: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
  path: z.string().optional(),
  statusCode: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export type AccessLogPageRequest = z.infer<typeof AccessLogPageRequestSchema>

// ─── Response ───

export const AccessLogPageItemSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  username: z.string().nullish(),
  method: z.string(),
  path: z.string(),
  statusCode: z.number().int(),
  duration: z.number().int(),
  clientIp: z.string().nullish(),
  createdAt: z.string(),
})

export type AccessLogPageItem = z.infer<typeof AccessLogPageItemSchema>

export const AccessLogDetailSchema = z.object({
  id: z.number().int(),
  traceId: z.string(),
  username: z.string().nullish(),
  method: z.string(),
  path: z.string(),
  queryString: z.string().nullish(),
  requestBody: z.string().nullish(),
  responseBody: z.string().nullish(),
  statusCode: z.number().int(),
  duration: z.number().int(),
  clientIp: z.string().nullish(),
  userAgent: z.string().nullish(),
  createdAt: z.string(),
})

export type AccessLogDetail = z.infer<typeof AccessLogDetailSchema>
