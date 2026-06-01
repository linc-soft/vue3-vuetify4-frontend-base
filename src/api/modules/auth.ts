import type { Result } from '@/api/types'
import http, { setAccessToken } from '@/api/client'
import {
  type ChangePasswordRequest,
  type ForceChangePasswordRequest,
  type ForgotPasswordRequest,
  type LoginRequest,
  type LoginResponse,
  LoginResponseSchema,
  type ResetPasswordRequest,
} from '@/api/schemas/auth'

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

/**
 * Forgot Password
 *
 * POST /api/auth/forgot-password
 * - Public endpoint (no auth, no CSRF)
 * - Always returns success for security (prevents username enumeration)
 */
export async function forgotPassword(params: ForgotPasswordRequest): Promise<Result<void>> {
  const { data } = await http.post<Result<void>>('/api/auth/forgot-password', params)
  return data
}

/**
 * Reset Password
 *
 * POST /api/auth/reset-password
 * - Public endpoint (no auth, no CSRF)
 * - Uses token from email link to set a new password
 */
export async function resetPassword(params: ResetPasswordRequest): Promise<Result<void>> {
  const { data } = await http.post<Result<void>>('/api/auth/reset-password', params)
  return data
}

/**
 * Change Password (Authenticated)
 *
 * POST /api/auth/change-password
 * - Requires authentication + CSRF
 * - Verifies current password before updating
 */
export async function changePassword(params: ChangePasswordRequest): Promise<Result<void>> {
  const { data } = await http.post<Result<void>>('/api/auth/change-password', params)
  return data
}

/**
 * Force Change Password (Authenticated, INACTIVE users only)
 *
 * POST /api/auth/force-change-password
 * - Requires authentication + CSRF
 * - For INACTIVE users who must change password on first login
 * - After success, user status changes from INACTIVE to ENABLED
 * - Returns a new access token with updated (ENABLED) status
 */
export async function forceChangePassword(
  params: ForceChangePasswordRequest,
): Promise<LoginResponse> {
  const { data } = await http.post<Result<LoginResponse>>('/api/auth/force-change-password', params)
  const parsed = LoginResponseSchema.parse(data.data)
  setAccessToken(parsed.accessToken)
  return parsed
}
