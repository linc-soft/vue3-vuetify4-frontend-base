/**
 * Helpers for handling binary download responses (e.g. PDF, CSV).
 */

/**
 * Result of a file download request.
 */
export interface DownloadResult {
  /** Binary content returned by the server. */
  blob: Blob
  /** Filename parsed from the Content-Disposition response header, if any. */
  filename: string | null
}

/**
 * Parse the filename from a Content-Disposition header value.
 *
 * Supports both RFC 5987 encoded form (`filename*=UTF-8''...`) and the
 * legacy `filename="..."` form. The RFC 5987 form takes precedence as it
 * preserves non-ASCII characters (e.g. Chinese, Japanese).
 */
export function parseFilenameFromContentDisposition(
  header: string | null | undefined,
): string | null {
  if (!header) return null

  // Prefer RFC 5987 encoded filename* parameter
  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim())
    } catch {
      // Fall through to legacy match
    }
  }

  // Fallback to the quoted or unquoted filename parameter
  const legacyMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  if (legacyMatch?.[1]) {
    return legacyMatch[1].trim()
  }

  return null
}
