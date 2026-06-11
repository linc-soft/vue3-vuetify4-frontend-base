import { z } from 'zod/v4'

// ─── Request ───

export const SqlLogPageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1).max(100),
  traceId: z.string().optional(),
  username: z.string().optional(),
  sqlType: z.enum(['SELECT', 'INSERT', 'UPDATE', 'DELETE']).optional(),
  mapperClass: z.string().optional(),
  mapperMethod: z.string().optional(),
  minDuration: z.number().int().optional(),
  maxDuration: z.number().int().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

export type SqlLogPageRequest = z.infer<typeof SqlLogPageRequestSchema>

// ─── Response ───

export const SqlLogPageItemSchema = z.object({
  id: z.number().int(),
  traceId: z.string().nullish(),
  sqlType: z.string().nullish(),
  mapperMethod: z.string().nullish(),
  duration: z.number().int().nullish(),
  username: z.string().nullish(),
  isSlow: z.boolean().nullish(),
  createdAt: z.string(),
})

export type SqlLogPageItem = z.infer<typeof SqlLogPageItemSchema>

export const SqlLogDetailSchema = z.object({
  id: z.number().int(),
  traceId: z.string().nullish(),
  sqlText: z.string().nullish(),
  duration: z.number().int().nullish(),
  createTime: z.string().nullish(),
  mapperClass: z.string().nullish(),
  mapperMethod: z.string().nullish(),
  sqlType: z.string().nullish(),
  username: z.string().nullish(),
  requestUrl: z.string().nullish(),
  requestMethod: z.string().nullish(),
  clientIp: z.string().nullish(),
  sqlParams: z.string().nullish(),
  rowCount: z.number().int().nullish(),
})

export type SqlLogDetail = z.infer<typeof SqlLogDetailSchema>
