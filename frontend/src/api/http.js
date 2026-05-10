const trimTrailingSlash = (value) => value.replace(/\/+$/, '')

const DEFAULT_PRODUCTS_API_BASE = 'http://localhost:4001'
const DEFAULT_ORDERS_API_BASE = 'http://localhost:4002'

export const PRODUCTS_API_BASE = trimTrailingSlash(
  import.meta.env.VITE_PRODUCTS_API_URL || DEFAULT_PRODUCTS_API_BASE
)

export const ORDERS_API_BASE = trimTrailingSlash(
  import.meta.env.VITE_ORDERS_API_URL || DEFAULT_ORDERS_API_BASE
)

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function parseJson(text) {
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function buildUrl(baseUrl, path, params = {}) {
  const url = new URL(path, `${trimTrailingSlash(baseUrl)}/`)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

export async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    body:
      options.body === undefined
        ? undefined
        : typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body),
  })

  const text = await response.text()
  const payload = parseJson(text)

  if (!response.ok) {
    const message =
      payload?.detail || payload?.message || `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  return payload
}
