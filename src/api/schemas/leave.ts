import { z } from 'zod/v4'

// ─── Request ───

export const LeavePageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1),
  employeeId: z.number().optional(),
  leaveType: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

export type LeavePageRequest = z.infer<typeof LeavePageRequestSchema>

export const LeaveSubmitRequestSchema = z.object({
  leaveType: z.string().min(1).max(2),
  startTime: z.string(),
  endTime: z.string(),
  days: z.number(),
  reason: z.string().max(500).optional(),
})

export type LeaveSubmitRequest = z.infer<typeof LeaveSubmitRequestSchema>

export const LeaveApprovalRequestSchema = z.object({
  id: z.number(),
  approved: z.boolean(),
  comment: z.string().max(500).optional(),
})

export type LeaveApprovalRequest = z.infer<typeof LeaveApprovalRequestSchema>

export const LeaveWithdrawRequestSchema = z.object({
  id: z.number(),
})

export type LeaveWithdrawRequest = z.infer<typeof LeaveWithdrawRequestSchema>

// ─── Response ───

export const LeaveInfoResponseSchema = z.object({
  id: z.number(),
  employeeId: z.number().nullable().optional(),
  leaveType: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  days: z.number().nullable().optional(),
  reason: z.string().nullable().optional(),
  status: z.string(),
  processInstanceId: z.string().nullable().optional(),
  approverId: z.number().nullable().optional(),
  approvalComment: z.string().nullable().optional(),
  version: z.number(),
})

export type LeaveInfoResponse = z.infer<typeof LeaveInfoResponseSchema>

export const LeavePageResponseItemSchema = z.object({
  id: z.number(),
  employeeId: z.number().nullable().optional(),
  leaveType: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  days: z.number().nullable().optional(),
  status: z.string(),
  approverId: z.number().nullable().optional(),
  createAt: z.string().nullable().optional(),
  version: z.number(),
})

export type LeavePageResponseItem = z.infer<typeof LeavePageResponseItemSchema>

export const LeaveTaskResponseItemSchema = z.object({
  leaveId: z.number(),
  employeeId: z.number().nullable().optional(),
  leaveType: z.string(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  days: z.number().nullable().optional(),
  reason: z.string().nullable().optional(),
  createAt: z.string().nullable().optional(),
})

export type LeaveTaskResponseItem = z.infer<typeof LeaveTaskResponseItemSchema>

export const AnnualBalanceBatchSchema = z.object({
  grantDate: z.string().nullable().optional(),
  expireDate: z.string().nullable().optional(),
  grantedDays: z.number().nullable().optional(),
  usedDays: z.number().nullable().optional(),
  remainingDays: z.number().nullable().optional(),
})

export type AnnualBalanceBatch = z.infer<typeof AnnualBalanceBatchSchema>

export const AnnualBalanceResponseSchema = z.object({
  employeeId: z.number().nullable().optional(),
  totalAvailable: z.number().nullable().optional(),
  batches: z.array(AnnualBalanceBatchSchema),
})

export type AnnualBalanceResponse = z.infer<typeof AnnualBalanceResponseSchema>
