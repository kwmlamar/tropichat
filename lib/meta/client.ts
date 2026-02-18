/**
 * Core Meta Graph API HTTP client with retry logic, rate limiting, and error handling.
 * All channel-specific clients (WhatsApp, Instagram, Messenger) use this base.
 */

import type { MetaApiError } from '@/types/unified-inbox'

const META_GRAPH_BASE_URL = 'https://graph.facebook.com/v22.0'
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

export class MetaApiClientError extends Error {
  constructor(
    message: string,
    public code: number,
    public subcode?: number,
    public fbtraceId?: string
  ) {
    super(message)
    this.name = 'MetaApiClientError'
  }
}

export class RateLimitError extends MetaApiClientError {
  constructor(
    message: string,
    public retryAfterMs: number
  ) {
    super(message, 4, undefined, undefined)
    this.name = 'RateLimitError'
  }
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  accessToken: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>
  params?: Record<string, string>
  retries?: number
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${META_GRAPH_BASE_URL}/${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

function isRetryable(status: number, errorCode?: number): boolean {
  // Retry on server errors, rate limits, and transient codes
  if (status === 429 || status >= 500) return true
  // Meta-specific transient error codes
  if (errorCode === 2 || errorCode === 4 || errorCode === 17) return true
  return false
}

function parseRateLimitHeaders(headers: Headers): number | null {
  const retryAfter = headers.get('Retry-After')
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10)
    return isNaN(seconds) ? null : seconds * 1000
  }
  // Meta uses x-business-use-case-usage for rate limit info
  const usageHeader = headers.get('x-business-use-case-usage')
  if (usageHeader) {
    try {
      const usage = JSON.parse(usageHeader)
      for (const entries of Object.values(usage) as Array<Array<{ estimated_time_to_regain_access?: number }>>) {
        for (const entry of entries) {
          if (entry.estimated_time_to_regain_access) {
            return entry.estimated_time_to_regain_access * 60 * 1000
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Make an authenticated request to the Meta Graph API.
 * Handles retries, rate limits, and error normalization.
 */
export async function metaApiRequest<T = unknown>(options: RequestOptions): Promise<T> {
  const { method, path, accessToken, body, params, retries = MAX_RETRIES } = options
  const url = buildUrl(path, params)

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
      }

      const fetchOptions: RequestInit = { method, headers }

      if (body && (method === 'POST' || method === 'DELETE')) {
        headers['Content-Type'] = 'application/json'
        fetchOptions.body = JSON.stringify(body)
      }

      const response = await fetch(url, fetchOptions)
      const responseText = await response.text()

      let data: T & Partial<MetaApiError>
      try {
        data = JSON.parse(responseText)
      } catch {
        throw new MetaApiClientError(
          `Invalid JSON response: ${responseText.substring(0, 200)}`,
          response.status
        )
      }

      // Handle errors
      if (!response.ok || data.error) {
        const err = data.error
        const code = err?.code ?? response.status
        const message = err?.message ?? `HTTP ${response.status}`

        // Rate limit
        if (response.status === 429 || code === 4 || code === 17) {
          const retryAfterMs = parseRateLimitHeaders(response.headers) ?? RETRY_DELAY_MS * (attempt + 1) * 2
          if (attempt < retries) {
            await sleep(retryAfterMs)
            continue
          }
          throw new RateLimitError(message, retryAfterMs)
        }

        // Retryable server error
        if (isRetryable(response.status, code) && attempt < retries) {
          await sleep(RETRY_DELAY_MS * Math.pow(2, attempt))
          continue
        }

        throw new MetaApiClientError(message, code, err?.error_subcode, err?.fbtrace_id)
      }

      return data
    } catch (error) {
      lastError = error as Error
      if (error instanceof MetaApiClientError && !isRetryable(error.code) && !(error instanceof RateLimitError)) {
        throw error
      }
      if (attempt < retries) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt))
        continue
      }
    }
  }

  throw lastError ?? new Error('Request failed after retries')
}
