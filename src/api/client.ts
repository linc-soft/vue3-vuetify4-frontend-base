import type { Result } from './types'
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'

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

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

// ─── Response Interceptor ───

http.interceptors.response.use(
  (response: AxiosResponse<Result>) => {
    const result = response.data
    // The backend uniformly wraps responses into Result&lt;T&gt; via GlobalResponseAdvice.
    // code === 200 indicates success.
    if (result.code !== undefined && result.code !== 200) {
      return Promise.reject(new ApiError(result.code, result.message ?? 'Request failed'))
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

    // Extract error information returned by the backend.
    const result = error.response?.data
    if (result?.code !== undefined) {
      throw Promise.reject(new ApiError(result.code, result.message ?? 'Request failed'))
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ApiError(-1, 'Request timeout, please try again')
    }
    if (!error.response) {
      throw new ApiError(-1, 'Network error, please check your connection')
    }
    throw Promise.reject(error)
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

async function tryRefreshToken(): Promise<boolean> {
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
  // Clear persisted auth store so the router guard sees isAuthenticated = false after reload
  localStorage.removeItem('auth')
  // Redirect to the login page, preserving the current path for post-login redirect
  const currentPath = window.location.pathname + window.location.search
  const redirect = currentPath && currentPath !== '/' && currentPath !== '/login' ? currentPath : ''
  window.location.href = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'
}

export default http
