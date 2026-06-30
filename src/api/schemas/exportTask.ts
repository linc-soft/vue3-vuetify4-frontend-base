import { z } from 'zod/v4'

export const ExportStatusSchema = z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'EXPIRED'])
export type ExportStatus = z.infer<typeof ExportStatusSchema>

export const ExportTypeSchema = z.enum(['LOG_TRACE', 'USER_REPORT'])
export type ExportType = z.infer<typeof ExportTypeSchema>

export const ExportTaskSchema = z.object({
  taskId: z.string(),
  type: z.string(),
  status: ExportStatusSchema,
  fileName: z.string().nullable(),
  fileSize: z.number().nullable(),
  rowCount: z.number().nullable(),
  completedAt: z.string().nullable(),
  expireAt: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
})
export type ExportTask = z.infer<typeof ExportTaskSchema>

export const ExportTaskPageResponseItemSchema = z.object({
  taskId: z.string(),
  type: z.string(),
  status: ExportStatusSchema,
  fileName: z.string().nullable(),
  fileSize: z.number().nullable(),
  expireAt: z.string().nullable(),
  createdAt: z.string(),
})
export type ExportTaskPageResponseItem = z.infer<typeof ExportTaskPageResponseItemSchema>

export const ExportTaskPageRequestSchema = z.object({
  page: z.number(),
  size: z.number(),
  type: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})
export type ExportTaskPageRequest = z.infer<typeof ExportTaskPageRequestSchema>

export const CreateExportTaskResponseSchema = z.object({
  taskId: z.string(),
})

export interface LogExportRequest {
  traceId?: string
  username?: string
  method?: string
  path?: string
  statusCode?: string
  startTime?: string
  endTime?: string
}
