import { z } from 'zod/v4'

// ─── Request ───

export const PositionListRequestSchema = z.object({
  positionName: z.string().optional(),
  status: z.string().optional(),
})

export type PositionListRequest = z.infer<typeof PositionListRequestSchema>

export const PositionCreateRequestSchema = z.object({
  positionName: z.string().min(1).max(64),
  positionCode: z.string().max(64).optional(),
  sortOrder: z.number().int().optional(),
  status: z.string().max(1).optional(),
})

export type PositionCreateRequest = z.infer<typeof PositionCreateRequestSchema>

export const PositionUpdateRequestSchema = z.object({
  id: z.number(),
  positionName: z.string().min(1).max(64),
  positionCode: z.string().max(64).optional(),
  sortOrder: z.number().int().optional(),
  status: z.string().max(1).optional(),
  version: z.number(),
})

export type PositionUpdateRequest = z.infer<typeof PositionUpdateRequestSchema>

export const PositionDeleteRequestSchema = z.object({
  id: z.number(),
  version: z.number(),
})

export type PositionDeleteRequest = z.infer<typeof PositionDeleteRequestSchema>

// ─── Response ───

export const PositionInfoResponseSchema = z.object({
  id: z.number(),
  positionName: z.string(),
  positionCode: z.string().nullable().optional(),
  sortOrder: z.number().nullable().optional(),
  status: z.string(),
  version: z.number(),
})

export type PositionInfoResponse = z.infer<typeof PositionInfoResponseSchema>
