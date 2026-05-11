import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type OperationLogDetail,
  OperationLogDetailSchema,
  type OperationLogPageItem,
  OperationLogPageItemSchema,
  type OperationLogPageRequest,
} from '@/api/schemas/operationLog'

/** GET /api/logs/operation/page - Paginated query of operation logs */
export async function getOperationLogPage(
  params: OperationLogPageRequest,
): Promise<Page<OperationLogPageItem>> {
  const { data } = await http.get<Result<Page<OperationLogPageItem>>>('/api/logs/operation/page', {
    params,
  })
  data.data.records = z.array(OperationLogPageItemSchema).parse(data.data.records)
  return data.data
}

/** GET /api/logs/operation/{id} - Get Operation Log Details */
export async function getOperationLog(id: number): Promise<OperationLogDetail> {
  const { data } = await http.get<Result<OperationLogDetail>>(`/api/logs/operation/${id}`)
  return OperationLogDetailSchema.parse(data.data)
}

/** GET /api/logs/operation/trace/{traceId} - Get list by traceId */
export async function getOperationLogsByTraceId(traceId: string): Promise<OperationLogDetail[]> {
  const { data } = await http.get<Result<OperationLogDetail[]>>(
    `/api/logs/operation/trace/${traceId}`,
  )
  return z.array(OperationLogDetailSchema).parse(data.data)
}

/** GET /api/logs/operation/target-types - Get Operation Object Type List */
export async function getOperationTargetTypes(): Promise<string[]> {
  const { data } = await http.get<Result<string[]>>('/api/logs/operation/target-types')
  return data.data
}
