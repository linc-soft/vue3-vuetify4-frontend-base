import type { Page, Result } from '@/api/types'
import { z } from 'zod/v4'
import http from '@/api/client'
import {
  type AnnualBalanceResponse,
  AnnualBalanceResponseSchema,
  type LeaveApprovalRequest,
  type LeaveInfoResponse,
  LeaveInfoResponseSchema,
  type LeavePageRequest,
  type LeavePageResponseItem,
  LeavePageResponseItemSchema,
  type LeaveSubmitRequest,
  type LeaveTaskResponseItem,
  LeaveTaskResponseItemSchema,
  type LeaveWithdrawRequest,
} from '@/api/schemas/leave'

/** GET /api/leaves/{id} */
export async function getLeave(id: number): Promise<LeaveInfoResponse> {
  const { data } = await http.get<Result<LeaveInfoResponse>>(`/api/leaves/${id}`)
  return LeaveInfoResponseSchema.parse(data.data)
}

/** GET /api/leaves/page */
export async function getLeavePage(params: LeavePageRequest): Promise<Page<LeavePageResponseItem>> {
  const { data } = await http.get<Result<Page<LeavePageResponseItem>>>('/api/leaves/page', {
    params,
  })
  data.data.records = z.array(LeavePageResponseItemSchema).parse(data.data.records)
  return data.data
}

/** GET /api/leaves/tasks */
export async function getMyPendingTasks(): Promise<LeaveTaskResponseItem[]> {
  const { data } = await http.get<Result<LeaveTaskResponseItem[]>>('/api/leaves/tasks')
  return z.array(LeaveTaskResponseItemSchema).parse(data.data)
}

/** POST /api/leaves */
export async function submitLeave(params: LeaveSubmitRequest): Promise<number> {
  const { data } = await http.post<Result<number>>('/api/leaves', params)
  return data.data
}

/** POST /api/leaves/review */
export async function reviewLeave(params: LeaveApprovalRequest): Promise<void> {
  await http.post('/api/leaves/review', params)
}

/** POST /api/leaves/withdraw */
export async function withdrawLeave(params: LeaveWithdrawRequest): Promise<void> {
  await http.post('/api/leaves/withdraw', params)
}

/** GET /api/leaves/annual-balance */
export async function getMyAnnualBalance(): Promise<AnnualBalanceResponse> {
  const { data } = await http.get<Result<AnnualBalanceResponse>>('/api/leaves/annual-balance')
  return AnnualBalanceResponseSchema.parse(data.data)
}

/** GET /api/leaves/annual-balance/{employeeId} */
export async function getAnnualBalanceByEmployeeId(
  employeeId: number,
): Promise<AnnualBalanceResponse> {
  const { data } = await http.get<Result<AnnualBalanceResponse>>(
    `/api/leaves/annual-balance/${employeeId}`,
  )
  return AnnualBalanceResponseSchema.parse(data.data)
}
