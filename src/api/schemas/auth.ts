import { z } from 'zod/v4'

// ─── Request ───

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const ForgotPasswordRequestSchema = z.object({
  usernameOrEmail: z.string().min(1),
})

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
})

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>

export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>

// ─── Response ───

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  requirePasswordChange: z.boolean().optional().default(false),
  language: z.string().nullable().optional(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const ProfileResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().nullable(),
  realName: z.string().nullable(),
  mobile: z.string().nullable(),
  gender: z.string().nullable(),
  birthday: z.string().nullable(),
  language: z.string().nullable(),
  deptId: z.number().nullable(),
  deptName: z.string().nullable(),
  positionId: z.number().nullable(),
  positionName: z.string().nullable(),
  status: z.string().nullable(),
  version: z.number(),
})

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>

export const ProfileUpdateRequestSchema = z.object({
  realName: z.string().max(64).nullable(),
  mobile: z.string().max(20).nullable(),
  gender: z
    .string()
    .regex(/^[012]$/)
    .nullable(),
  birthday: z.string().nullable(),
  language: z.string().regex(/^(en|zh|ja)$/),
  version: z.number(),
})

export type ProfileUpdateRequest = z.infer<typeof ProfileUpdateRequestSchema>

export const ForceChangePasswordRequestSchema = z.object({
  newPassword: z.string().min(8),
})

export type ForceChangePasswordRequest = z.infer<typeof ForceChangePasswordRequestSchema>
