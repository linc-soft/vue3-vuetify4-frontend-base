/**
 * Unified backend response structure
 */
export interface Result<T = unknown> {
  code: number
  message: string
  data: T
}

/**
 * Backend pagination response structure
 */
export interface Page<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}
