import type { Result } from './types'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { clearEnumsCache } from '@/composables/useEnums'
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from '@/composables/useLocale'
import { clearSelectOptionsCache } from '@/composables/useSelectOptions'

/**
 * Axios Instance Configuration
 *
 * Security Settings (corresponding to backend Spring Security):
 * - CSRF: Cookie name "csrfToken", Header name "X-CSRF-Token"
 * - JWT: Access Token passed via Authorization Bearer
 * - Refresh Token: passed via HttpOnly Cookie (automatically sent by the browser)
 * - Session: STATELESS (stateless, fully relying on JWT)
 */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 10_000,
  withCredentials: true,
  xsrfCookieName: 'csrfToken',
  xsrfHeaderName: 'X-CSRF-Token',
})

// ─── Token Management ───

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

// ─── Request Interceptor ───

function getCurrentLocale(): string {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) return stored
  } catch {
    // localStorage may be unavailable
  }
  return 'en'
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  config.headers.set('Accept-Language', getCurrentLocale())
  return config
})

// ─── Response Interceptor ───

http.interceptors.response.use(
  async (response: AxiosResponse<Result>) => {
    // When responseType is 'blob', the response body is a Blob even if it contains JSON.
    // Check the Content-Type header to detect JSON-wrapped errors.
    if (response.config.responseType === 'blob' && response.data instanceof Blob) {
      const contentType = response.headers['content-type'] ?? ''
      if (contentType.includes('application/json')) {
        const text = await response.data.text()
        const result = JSON.parse(text) as Result
        if (result.code !== undefined && result.code !== 200) {
          throw new ApiError(result.code, result.message ?? 'Request failed')
        }
        // code === 200: return the blob as-is for the caller.
        return response
      }
    }

    const result = response.data
    // The backend uniformly wraps responses into Result&lt;T&gt; via GlobalResponseAdvice.
    // code === 200 indicates success.
    if (result.code !== undefined && result.code !== 200) {
      throw new ApiError(result.code, result.message ?? 'Request failed')
    }
    return response
  },
  async (error: AxiosError<Result>) => {
    const status = error.response?.status

    if (status === 401) {
      // Token expired, attempting to refresh
      const refreshed = await tryRefreshToken()
      if (refreshed && error.config) {
        // Retry the original request with the new token.
        return http(error.config)
      }
      // Refresh failed, clearing login status
      handleUnauthorized()
    }

    // Handle force password change requirement (INACTIVE user status)
    const errResult = error.response?.data
    if (errResult?.code === 999_422) {
      handleForcePasswordChange()
    }

    // Handle blob error responses — read the blob as text to extract the error message.
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text()
        const result = JSON.parse(text) as Result
        if (result?.code !== undefined) {
          throw new ApiError(result.code, result.message ?? 'Request failed')
        }
      } catch (error_) {
        if (error_ instanceof ApiError) throw error_
        // Failed to parse blob as JSON; fall through to default error handling.
      }
    }

    // Extract error information returned by the backend.
    const result = error.response?.data
    if (result?.code !== undefined) {
      throw new ApiError(result.code, result.message ?? 'Request failed')
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ApiError(-1, 'Request timeout, please try again')
    }
    if (!error.response) {
      throw new ApiError(-1, 'Network error, please check your connection')
    }
    throw error
  },
)

// ─── Error Class ───

export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Token Refresh ───

let refreshPromise: Promise<boolean> | null = null

export async function tryRefreshToken(): Promise<boolean> {
  // Prevent concurrent refresh
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      // Read CSRF token from cookie (backend requires X-CSRF-Token header for refresh endpoint)
      const csrfToken = document.cookie
        .split('; ')
        .find(c => c.startsWith('csrfToken='))
        ?.split('=')[1]

      const { data } = await axios.post<Result<{ accessToken: string }>>(
        '/api/auth/refresh',
        null,
        {
          baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
          withCredentials: true,
          headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
        },
      )
      if (data.code === 200 && data.data?.accessToken) {
        setAccessToken(data.data.accessToken)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function handleUnauthorized() {
  setAccessToken(null)
  // Clear select options cache and enums cache
  clearSelectOptionsCache()
  clearEnumsCache()
  // Clear persisted auth store so the router guard sees isAuthenticated = false after reload
  localStorage.removeItem('auth')
  // Redirect to the login page, preserving the current path for post-login redirect
  const currentPath = window.location.pathname + window.location.search
  const redirect = currentPath && currentPath !== '/' && currentPath !== '/login' ? currentPath : ''
  window.location.href = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
}

function handleForcePasswordChange() {
  // Mark that the user must change their password and redirect to the force-change-password page
  try {
    const authData = localStorage.getItem('auth')
    if (authData) {
      const parsed = JSON.parse(authData)
      parsed.requirePasswordChange = true
      localStorage.setItem('auth', JSON.stringify(parsed))
    }
  } catch {
    // Ignore localStorage errors
  }
  window.location.href = '/force-change-password'
}

export default http
