import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type ErrorLogDetail,
  ErrorLogDetailSchema,
  type ErrorLogPageItem,
  ErrorLogPageItemSchema,
  type ErrorLogPageRequest,
} from '@/api/schemas/errorLog'

/** GET /api/logs/error/page - Paginated query of error logs */
export async function getErrorLogPage(
  params: ErrorLogPageRequest,
): Promise<Page<ErrorLogPageItem>> {
  const { data } = await http.get<Result<Page<ErrorLogPageItem>>>('/api/logs/error/page', {
    params,
  })
  data.data.records = z.array(ErrorLogPageItemSchema).parse(data.data.records)
  return data.data
}

/** GET /api/logs/error/{id} - Get Error Log Details */
export async function getErrorLog(id: number): Promise<ErrorLogDetail> {
  const { data } = await http.get<Result<ErrorLogDetail>>(`/api/logs/error/${id}`)
  return ErrorLogDetailSchema.parse(data.data)
}

/** GET /api/logs/error/trace/{traceId} - Get details by traceId */
export async function getErrorLogByTraceId(traceId: string): Promise<ErrorLogDetail | null> {
  const { data } = await http.get<Result<ErrorLogDetail | null>>(`/api/logs/error/trace/${traceId}`)
  return data.data ? ErrorLogDetailSchema.parse(data.data) : null
}
