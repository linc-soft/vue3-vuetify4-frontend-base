import type { Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type PositionCreateRequest,
  type PositionDeleteRequest,
  type PositionInfoResponse,
  PositionInfoResponseSchema,
  type PositionListRequest,
  type PositionUpdateRequest,
} from '@/api/schemas/position'

/** GET /api/master/positions/{id} */
export async function getPosition(id: number): Promise<PositionInfoResponse> {
  const { data } = await http.get<Result<PositionInfoResponse>>(`/api/master/positions/${id}`)
  return PositionInfoResponseSchema.parse(data.data)
}

/** GET /api/master/positions */
export async function getPositionList(
  params?: PositionListRequest,
): Promise<PositionInfoResponse[]> {
  const { data } = await http.get<Result<PositionInfoResponse[]>>('/api/master/positions', {
    params,
  })
  return z.array(PositionInfoResponseSchema).parse(data.data)
}

/** POST /api/master/positions */
export async function createPosition(params: PositionCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/master/positions', params)
  return data.data
}

/** PUT /api/master/positions */
export async function updatePosition(params: PositionUpdateRequest): Promise<void> {
  await http.put('/api/master/positions', params)
}

/** DELETE /api/master/positions */
export async function deletePosition(params: PositionDeleteRequest): Promise<void> {
  await http.delete('/api/master/positions', { data: params })
}
