import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type SqlLogDetail,
  SqlLogDetailSchema,
  type SqlLogPageItem,
  SqlLogPageItemSchema,
  type SqlLogPageRequest,
} from '@/api/schemas/sqlLog'

/** GET /api/logs/sql/page - Paginated query of SQL logs */
export async function getSqlLogPage(params: SqlLogPageRequest): Promise<Page<SqlLogPageItem>> {
  const { data } = await http.get<Result<Page<SqlLogPageItem>>>('/api/logs/sql/page', {
    params,
  })
  data.data.records = z.array(SqlLogPageItemSchema).parse(data.data.records)
  return data.data
}

/** GET /api/logs/sql/{id} - Get SQL Log Details */
export async function getSqlLog(id: number): Promise<SqlLogDetail> {
  const { data } = await http.get<Result<SqlLogDetail>>(`/api/logs/sql/${id}`)
  return SqlLogDetailSchema.parse(data.data)
}
