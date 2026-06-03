import { z } from 'zod/v4'

// ─── Enums ───

export const LeaveTypeSchema = z.enum([
  'ANNUAL',
  'PERSONAL',
  'SICK',
  'MARRIAGE',
  'PATERNITY',
  'BEREAVEMENT',
])

export const LeaveStatusSchema = z.enum(['APPLYING', 'APPROVED', 'REJECTED'])

// ─── Request ───

export const SaveLeaveRequestSchema = z.object({
  userId: z.number().int().positive(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  leaveType: LeaveTypeSchema,
  duration: z.number().multipleOf(0.5).positive(),
  reason: z.string().min(1),
  fileIds: z.array(z.number()).optional(),
})

export const LeavePageRequestSchema = z.object({
  page: z.number().int().min(1),
  size: z.number().int().min(1),
  userId: z.number().int().optional(),
  year: z.number().int().optional(),
  leaveType: z.number().int().optional(),
  status: z.number().int().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
})

export const UpdateLeaveStatusRequestSchema = z.object({
  id: z.number().int().positive(),
  status: LeaveStatusSchema,
  reason: z.string().optional(),
})

export const InitAnnualLeaveRequestSchema = z.object({
  userId: z.number().int(),
  year: z.number().int().min(2025),
  force: z.boolean().optional(),
})

// ─── Response ───

export const FileMetadataResponseSchema = z.object({
  id: z.number(),
  fileType: z.number(),
  originalFilename: z.string(),
  dateUrl: z.string(),
  storedName: z.string(),
  contentType: z.string(),
  size: z.number(),
})

export const LeavePageResponseSchema = z.object({
  id: z.number(),
  userId: z.number(),
  nickname: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  leaveType: z.number(),
  duration: z.number(),
  reason: z.string().nullable(),
  status: z.number(),
  approverNickname: z.string().nullable(),
  approveTime: z.string().nullable(),
  approveReason: z.string().nullable(),
  files: z.array(FileMetadataResponseSchema),
})

export const LeaveInfoItemSchema = z.object({
  leaveType: z.number(),
  leaveDays: z.number(),
})

export const LeaveInfoResponseSchema = z.object({
  annualEffectiveDate1: z.string().nullable(),
  annualLeaveDays1: z.number().nullable(),
  annualEffectiveDate2: z.string().nullable(),
  annualLeaveDays2: z.number().nullable(),
  leaveInfos: z.array(LeaveInfoItemSchema),
})

export const AnnualRemainResponseSchema = z.object({
  remainDays: z.number(),
})

// ─── Types ───

export type SaveLeaveRequest = z.infer<typeof SaveLeaveRequestSchema>
export type LeavePageRequest = z.infer<typeof LeavePageRequestSchema>
export type UpdateLeaveStatusRequest = z.infer<typeof UpdateLeaveStatusRequestSchema>
export type InitAnnualLeaveRequest = z.infer<typeof InitAnnualLeaveRequestSchema>
export type LeavePageResponse = z.infer<typeof LeavePageResponseSchema>
export type FileMetadataResponse = z.infer<typeof FileMetadataResponseSchema>
export type LeaveInfoResponse = z.infer<typeof LeaveInfoResponseSchema>
export type AnnualRemainResponse = z.infer<typeof AnnualRemainResponseSchema>
