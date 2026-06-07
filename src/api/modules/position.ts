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

/** GET /api/positions/{id} */
export async function getPosition(id: number): Promise<PositionInfoResponse> {
  const { data } = await http.get<Result<PositionInfoResponse>>(`/api/positions/${id}`)
  return PositionInfoResponseSchema.parse(data.data)
}

/** GET /api/positions */
export async function getPositionList(
  params?: PositionListRequest,
): Promise<PositionInfoResponse[]> {
  const { data } = await http.get<Result<PositionInfoResponse[]>>('/api/positions', { params })
  return z.array(PositionInfoResponseSchema).parse(data.data)
}

/** POST /api/positions */
export async function createPosition(params: PositionCreateRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/positions', params)
  return data.data
}

/** PUT /api/positions */
export async function updatePosition(params: PositionUpdateRequest): Promise<void> {
  await http.put('/api/positions', params)
}

/** DELETE /api/positions */
export async function deletePosition(params: PositionDeleteRequest): Promise<void> {
  await http.delete('/api/positions', { data: params })
}
