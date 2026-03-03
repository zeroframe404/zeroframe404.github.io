const NOMINATIM_REVERSE_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'
const GEOCODING_PROVIDER = 'nominatim'
const GEOCODING_TIMEOUT_MS = 5_000
const GEOCODING_MIN_INTERVAL_MS = 1_100
const GEOCODING_CONTACT_EMAIL =
  process.env.GEOCODING_CONTACT_EMAIL?.trim() ||
  process.env.VITE_CONTACT_EMAIL?.trim() ||
  'contacto@segurosdocksud.com'
const GEOCODING_USER_AGENT = `SegurosDockSud/1.0 (${GEOCODING_CONTACT_EMAIL})`

let geocodingThrottlePromise: Promise<void> = Promise.resolve()
let nextGeocodingSlotAt = 0

interface CoordinatesInput {
  latitude: number
  longitude: number
}

interface NominatimAddressPayload {
  road?: unknown
  pedestrian?: unknown
  house_number?: unknown
  postcode?: unknown
  city?: unknown
  town?: unknown
  village?: unknown
  suburb?: unknown
  neighbourhood?: unknown
  state?: unknown
  state_district?: unknown
  county?: unknown
  country?: unknown
}

function asNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}

function normalizePostalCode(rawPostalCode: string | null) {
  if (!rawPostalCode) {
    return null
  }

  const normalized = rawPostalCode.trim().toUpperCase()
  const digitsMatch = normalized.match(/(\d{4})/)
  return digitsMatch ? digitsMatch[1] : null
}

function buildReverseGeocodingUrl(input: CoordinatesInput) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: input.latitude.toString(),
    lon: input.longitude.toString(),
    addressdetails: '1',
    zoom: '18',
    'accept-language': 'es',
    email: GEOCODING_CONTACT_EMAIL
  })

  return `${NOMINATIM_REVERSE_ENDPOINT}?${params.toString()}`
}

function resolveCity(address: NominatimAddressPayload) {
  return (
    asNonEmptyString(address.city) ||
    asNonEmptyString(address.town) ||
    asNonEmptyString(address.village) ||
    asNonEmptyString(address.suburb) ||
    asNonEmptyString(address.state_district) ||
    asNonEmptyString(address.county)
  )
}

function resolveStreet(address: NominatimAddressPayload) {
  return asNonEmptyString(address.road) || asNonEmptyString(address.pedestrian)
}

function resolveAddressLine(street: string | null, houseNumber: string | null) {
  if (street && houseNumber) {
    return `${street} ${houseNumber}`
  }

  return street || houseNumber || null
}

async function throttleGeocodingRequests() {
  const runAfterCurrent = geocodingThrottlePromise.then(async () => {
    const now = Date.now()
    const waitMs = Math.max(0, nextGeocodingSlotAt - now)

    if (waitMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, waitMs)
      })
    }

    nextGeocodingSlotAt = Date.now() + GEOCODING_MIN_INTERVAL_MS
  })

  geocodingThrottlePromise = runAfterCurrent.catch(() => undefined)
  await runAfterCurrent
}

export interface ReverseAddressResolution {
  provider: string
  latitude: number
  longitude: number
  display_name: string | null
  street: string | null
  house_number: string | null
  line: string | null
  postal_code: string | null
  city: string | null
  neighborhood: string | null
  state: string | null
  country: string | null
}

export async function resolveAddressFromCoordinates(
  input: CoordinatesInput
): Promise<ReverseAddressResolution | null> {
  await throttleGeocodingRequests()

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => {
    abortController.abort()
  }, GEOCODING_TIMEOUT_MS)

  try {
    const response = await fetch(buildReverseGeocodingUrl(input), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': GEOCODING_USER_AGENT,
        Referer: 'https://dmartinezseguros.com'
      },
      signal: abortController.signal
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as unknown
    const record = asRecord(payload)
    if (!record) {
      return null
    }

    const address = asRecord(record.address) as NominatimAddressPayload | null
    const displayName = asNonEmptyString(record.display_name)
    const street = resolveStreet(address ?? {})
    const houseNumber = asNonEmptyString(address?.house_number)

    return {
      provider: GEOCODING_PROVIDER,
      latitude: input.latitude,
      longitude: input.longitude,
      display_name: displayName,
      street,
      house_number: houseNumber,
      line: resolveAddressLine(street, houseNumber),
      postal_code: normalizePostalCode(asNonEmptyString(address?.postcode)),
      city: resolveCity(address ?? {}),
      neighborhood:
        asNonEmptyString(address?.neighbourhood) || asNonEmptyString(address?.suburb),
      state: asNonEmptyString(address?.state),
      country: asNonEmptyString(address?.country)
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
