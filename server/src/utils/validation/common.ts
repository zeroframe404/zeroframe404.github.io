export function normalizeLimit(rawLimit: unknown, defaultLimit = 500, maxLimit = 1000) {
  const numericLimit =
    typeof rawLimit === 'string' ? Number.parseInt(rawLimit, 10) : Number(rawLimit)

  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return defaultLimit
  }

  return Math.min(Math.trunc(numericLimit), maxLimit)
}

export function asString(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

export function asOptionalString(value: unknown) {
  const parsed = asString(value)
  return parsed.length > 0 ? parsed : undefined
}

