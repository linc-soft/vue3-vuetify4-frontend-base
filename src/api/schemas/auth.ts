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
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>
