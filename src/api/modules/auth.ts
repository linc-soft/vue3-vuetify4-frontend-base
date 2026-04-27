import type { Result } from '@/api/types'
import http, { setAccessToken } from '@/api/client'
import { type LoginRequest, type LoginResponse, LoginResponseSchema } from '@/api/schemas/auth'

/**
 * User Login
 *
 * POST /api/auth/login
 * - CSRF exempt (backend configured with ignoringRequestMatchers)
 * - Upon success, access token is returned in the response body, refresh token is issued via Set-Cookie with HttpOnly flag
 */
export async function login(params: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<Result<LoginResponse>>('/api/auth/login', params)
  const parsed = LoginResponseSchema.parse(data.data)
  setAccessToken(parsed.accessToken)
  return parsed
}

/**
 * User Logout
 *
 * POST /api/auth/logout
 * - Revoke access token and refresh token
 * - Clear refresh token cookie
 */
export async function logout(): Promise<void> {
  await http.post('/api/auth/logout')
  setAccessToken(null)
}
