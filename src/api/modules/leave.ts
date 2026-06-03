import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type AnnualRemainResponse,
  AnnualRemainResponseSchema,
  type InitAnnualLeaveRequest,
  type LeaveInfoResponse,
  LeaveInfoResponseSchema,
  type LeavePageRequest,
  type LeavePageResponse,
  LeavePageResponseSchema,
  type SaveLeaveRequest,
  type UpdateLeaveStatusRequest,
} from '@/api/schemas/leave'

/** POST /api/leaves — Create a new leave request */
export async function createLeave(params: SaveLeaveRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/leaves', params)
  return data.data
}

/** GET /api/leaves/page — Paginated leave list */
export async function getLeavePage(params: LeavePageRequest): Promise<Page<LeavePageResponse>> {
  const { data } = await http.get<Result<Page<LeavePageResponse>>>('/api/leaves/page', { params })
  data.data.records = z.array(LeavePageResponseSchema).parse(data.data.records)
  return data.data
}

/** GET /api/leaves/year-list — Available year list */
export async function getYearList(): Promise<number[]> {
  const { data } = await http.get<Result<number[]>>('/api/leaves/year-list')
  return data.data
}

/** GET /api/leaves/info — Current user's annual leave info */
export async function getLeaveInfo(): Promise<LeaveInfoResponse> {
  const { data } = await http.get<Result<LeaveInfoResponse>>('/api/leaves/info')
  return LeaveInfoResponseSchema.parse(data.data)
}

/** GET /api/leaves/annual-remain — Remaining annual leave days */
export async function getAnnualRemain(date: string): Promise<AnnualRemainResponse> {
  const { data } = await http.get<Result<AnnualRemainResponse>>('/api/leaves/annual-remain', {
    params: { date },
  })
  return AnnualRemainResponseSchema.parse(data.data)
}

/** PUT /api/leaves/status — Approve or reject a leave request */
export async function updateLeaveStatus(params: UpdateLeaveStatusRequest): Promise<void> {
  await http.put('/api/leaves/status', params)
}

/** DELETE /api/leaves — Delete/cancel a leave request */
export async function deleteLeave(id: number): Promise<void> {
  await http.delete('/api/leaves', { params: { id } })
}

/** POST /api/leaves/init-annual-leave — Initialize annual leave balances */
export async function initAnnualLeave(params: InitAnnualLeaveRequest): Promise<void> {
  await http.post('/api/leaves/init-annual-leave', params)
}
