import { z } from 'zod/v4'

// ─── Request ───

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export type LoginRequest = z.infer<typeof LoginRequestSchema>

// ─── Response ───

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>
