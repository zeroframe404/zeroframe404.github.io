function normalizePath(path: string) {
  if (path.startsWith('/')) {
    return path
  }

  return `/${path}`
}

function resolveApiUrl(path: string) {
  const normalizedPath = normalizePath(path)
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

  if (!baseUrl) {
    return normalizedPath
  }

  return `${baseUrl.replace(/\/+$/, '')}${normalizedPath}`
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(resolveApiUrl(path), {
    credentials: 'include',
    ...init
  })

  return response
}

export async function readApiError(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { error?: unknown }
    if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
      return payload.error
    }
  } catch {
    // Ignore JSON parsing errors and return fallback.
  }

  return fallbackMessage
}

