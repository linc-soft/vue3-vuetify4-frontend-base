import { z } from 'zod/v4'
import { AccessLogDetailSchema } from './accessLog'
import { ErrorLogDetailSchema } from './errorLog'
import { OperationLogDetailSchema } from './operationLog'

// ─── Response ───

export const TraceDetailSchema = z.object({
  accessLog: AccessLogDetailSchema.nullable(),
  errorLog: ErrorLogDetailSchema.nullable(),
  operationLogs: z.array(OperationLogDetailSchema),
})

export type TraceDetail = z.infer<typeof TraceDetailSchema>
