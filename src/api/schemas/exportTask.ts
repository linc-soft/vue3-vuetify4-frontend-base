import { z } from 'zod/v4'

export const ExportStatusSchema = z.enum(['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'EXPIRED'])
export type ExportStatus = z.infer<typeof ExportStatusSchema>

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
