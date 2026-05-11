import type { Result } from '@/api/types'
import http from '@/api/client'
import { type TraceDetail, TraceDetailSchema } from '@/api/schemas/trace'

/** GET /api/logs/trace/{traceId} - Get complete link trace information */
export async function getTraceDetail(traceId: string): Promise<TraceDetail> {
  const { data } = await http.get<Result<TraceDetail>>(`/api/logs/trace/${traceId}`)
  return TraceDetailSchema.parse(data.data)
}
