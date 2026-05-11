import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type AccessLogDetail,
  AccessLogDetailSchema,
  type AccessLogPageItem,
  AccessLogPageItemSchema,
  type AccessLogPageRequest,
} from '@/api/schemas/accessLog'

/** GET /api/logs/access/page - Paginated query of access logs */
export async function getAccessLogPage(
  params: AccessLogPageRequest,
): Promise<Page<AccessLogPageItem>> {
  const { data } = await http.get<Result<Page<AccessLogPageItem>>>('/api/logs/access/page', {
    params,
  })
  data.data.records = z.array(AccessLogPageItemSchema).parse(data.data.records)
  return data.data
}

/** GET /api/logs/access/{id} - Get Access Log Details */
export async function getAccessLog(id: number): Promise<AccessLogDetail> {
  const { data } = await http.get<Result<AccessLogDetail>>(`/api/logs/access/${id}`)
  return AccessLogDetailSchema.parse(data.data)
}

/** GET /api/logs/access/trace/{traceId} - Get details by traceId */
export async function getAccessLogByTraceId(traceId: string): Promise<AccessLogDetail> {
  const { data } = await http.get<Result<AccessLogDetail>>(`/api/logs/access/trace/${traceId}`)
  return AccessLogDetailSchema.parse(data.data)
}

/** GET /api/logs/access/export - Export access logs */
export async function exportAccessLogs(
  params: Omit<AccessLogPageRequest, 'page' | 'size'>,
): Promise<Blob> {
  const { data } = await http.get('/api/logs/access/export', {
    params,
    responseType: 'blob',
  })
  return data
}
