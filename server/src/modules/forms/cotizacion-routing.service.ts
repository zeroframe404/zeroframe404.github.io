import {
  CotizacionRoutingBranch as PrismaCotizacionRoutingBranch,
  CotizacionRoutingStatus as PrismaCotizacionRoutingStatus,
  Prisma
} from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../db/prisma.js'

const GOOGLE_GEOCODING_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json'
const GEOCODING_PROVIDER = 'google'
const GEOCODING_TIMEOUT_MS = 4_000

const WHATSAPP_BY_BRANCH: Record<PrismaCotizacionRoutingBranch, string> = {
  avellaneda: '5491140830416',
  lanus: '5491136942482',
  lejanos: '5491140830416'
}

let ensurePostgisPromise: Promise<void> | null = null

interface GeocodingCoordinates {
  latitude: number
  longitude: number
  provider: string
  formattedAddress: string | null
}

interface NearestRoutingBranch {
  branch: PrismaCotizacionRoutingBranch
  distanceKm: number
}

export interface CotizacionRoutingResolution {
  routingBranch: PrismaCotizacionRoutingBranch
  routingDistanceKm: number | null
  routingPostalCodeNormalized: string | null
  routingLatitude: number | null
  routingLongitude: number | null
  routingProvider: string | null
  routingStatus: PrismaCotizacionRoutingStatus
  redirectUrl: string
}

function normalizePostalCode(rawPostalCode: string | null | undefined) {
  const value = rawPostalCode?.trim().toUpperCase() ?? ''
  if (!value) {
    return null
  }

  const digitsMatch = value.match(/(\d{4})/)
  return digitsMatch ? digitsMatch[1] : null
}

function toCotizacionRoutingBranch(value: string): PrismaCotizacionRoutingBranch | null {
  if (
    value === PrismaCotizacionRoutingBranch.avellaneda ||
    value === PrismaCotizacionRoutingBranch.lanus ||
    value === PrismaCotizacionRoutingBranch.lejanos
  ) {
    return value
  }

  return null
}

function parseDistanceKm(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function roundDistanceKm(value: number) {
  return Math.round(value * 100) / 100
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function buildGoogleGeocodingUrl(postalCodeNormalized: string) {
  const params = new URLSearchParams({
    key: env.GOOGLE_GEOCODING_API_KEY ?? '',
    language: 'es',
    components: `country:AR|postal_code:${postalCodeNormalized}`
  })

  return `${GOOGLE_GEOCODING_ENDPOINT}?${params.toString()}`
}

export function getRedirectUrlForRoutingBranch(branch: PrismaCotizacionRoutingBranch) {
  return `https://wa.me/${WHATSAPP_BY_BRANCH[branch]}`
}

async function ensurePostgisExtension() {
  if (!ensurePostgisPromise) {
    ensurePostgisPromise = prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis')
      .then(() => undefined)
      .catch((error) => {
        ensurePostgisPromise = null
        throw error
      })
  }

  await ensurePostgisPromise
}

async function loadCachedGeocode(postalCodeNormalized: string): Promise<GeocodingCoordinates | null> {
  const cached = await prisma.postalGeocodeCache.findUnique({
    where: {
      postalCodeNormalized
    }
  })

  if (!cached) {
    return null
  }

  await prisma.postalGeocodeCache.update({
    where: {
      postalCodeNormalized
    },
    data: {
      lastUsedAt: new Date()
    }
  })

  return {
    latitude: cached.latitude,
    longitude: cached.longitude,
    provider: cached.provider,
    formattedAddress: cached.formattedAddress
  }
}

async function fetchGoogleGeocode(postalCodeNormalized: string): Promise<GeocodingCoordinates | null> {
  if (!env.GOOGLE_GEOCODING_API_KEY) {
    return null
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => {
    abortController.abort()
  }, GEOCODING_TIMEOUT_MS)

  try {
    const response = await fetch(buildGoogleGeocodingUrl(postalCodeNormalized), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: abortController.signal
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as unknown
    if (!isRecord(payload)) {
      return null
    }

    const status = typeof payload.status === 'string' ? payload.status : ''
    if (status !== 'OK') {
      return null
    }

    const results = Array.isArray(payload.results) ? payload.results : []
    const firstResult = results.find((item) => isRecord(item))
    if (!firstResult) {
      return null
    }

    const geometry = isRecord(firstResult.geometry) ? firstResult.geometry : null
    const location = geometry && isRecord(geometry.location) ? geometry.location : null

    const latitude = location ? asNumber(location.lat) : null
    const longitude = location ? asNumber(location.lng) : null

    if (latitude === null || longitude === null) {
      return null
    }

    const formattedAddress =
      typeof firstResult.formatted_address === 'string'
        ? firstResult.formatted_address
        : null

    return {
      latitude,
      longitude,
      provider: GEOCODING_PROVIDER,
      formattedAddress
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function resolvePostalCoordinates(postalCodeNormalized: string): Promise<GeocodingCoordinates | null> {
  const cached = await loadCachedGeocode(postalCodeNormalized)
  if (cached) {
    return cached
  }

  const fetched = await fetchGoogleGeocode(postalCodeNormalized)
  if (!fetched) {
    return null
  }

  await prisma.postalGeocodeCache.upsert({
    where: {
      postalCodeNormalized
    },
    update: {
      latitude: fetched.latitude,
      longitude: fetched.longitude,
      provider: fetched.provider,
      formattedAddress: fetched.formattedAddress,
      lastUsedAt: new Date()
    },
    create: {
      postalCodeNormalized,
      latitude: fetched.latitude,
      longitude: fetched.longitude,
      provider: fetched.provider,
      formattedAddress: fetched.formattedAddress,
      lastUsedAt: new Date()
    }
  })

  return fetched
}

async function getNearestRoutingBranch(coordinates: {
  latitude: number
  longitude: number
}): Promise<NearestRoutingBranch | null> {
  await ensurePostgisExtension()

  const nearestRows = await prisma.$queryRaw<Array<{ branch_key: string; distance_km: unknown }>>(
    Prisma.sql`
      SELECT
        "key"::text AS branch_key,
        (
          ST_DistanceSphere(
            ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326),
            ST_SetSRID(ST_MakePoint(${coordinates.longitude}, ${coordinates.latitude}), 4326)
          ) / 1000.0
        ) AS distance_km
      FROM "routing_branches"
      WHERE "is_active" = true
      ORDER BY distance_km ASC
      LIMIT 1
    `
  )

  if (nearestRows.length === 0) {
    return null
  }

  const firstRow = nearestRows[0]
  const branch = toCotizacionRoutingBranch(firstRow.branch_key)
  const distanceKm = parseDistanceKm(firstRow.distance_km)

  if (!branch || distanceKm === null) {
    return null
  }

  return {
    branch,
    distanceKm
  }
}

function buildFallbackResolution(input: {
  status: PrismaCotizacionRoutingStatus
  postalCodeNormalized?: string | null
  coordinates?: GeocodingCoordinates | null
}): CotizacionRoutingResolution {
  const fallbackBranch = PrismaCotizacionRoutingBranch.lejanos

  return {
    routingBranch: fallbackBranch,
    routingDistanceKm: null,
    routingPostalCodeNormalized: input.postalCodeNormalized ?? null,
    routingLatitude: input.coordinates?.latitude ?? null,
    routingLongitude: input.coordinates?.longitude ?? null,
    routingProvider: input.coordinates?.provider ?? null,
    routingStatus: input.status,
    redirectUrl: getRedirectUrlForRoutingBranch(fallbackBranch)
  }
}

export async function resolveCotizacionRouting(input: {
  codigoPostal: string | null | undefined
}): Promise<CotizacionRoutingResolution> {
  const postalCodeNormalized = normalizePostalCode(input.codigoPostal)
  if (!postalCodeNormalized) {
    return buildFallbackResolution({
      status: PrismaCotizacionRoutingStatus.fallback_invalid_cp
    })
  }

  const coordinates = await resolvePostalCoordinates(postalCodeNormalized)
  if (!coordinates) {
    return buildFallbackResolution({
      status: PrismaCotizacionRoutingStatus.fallback_geocode_failed,
      postalCodeNormalized
    })
  }

  let nearestBranch: NearestRoutingBranch | null = null
  try {
    nearestBranch = await getNearestRoutingBranch({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    })
  } catch {
    nearestBranch = null
  }

  if (!nearestBranch) {
    return buildFallbackResolution({
      status: PrismaCotizacionRoutingStatus.fallback_geocode_failed,
      postalCodeNormalized,
      coordinates
    })
  }

  const thresholdKm = env.ROUTING_DISTANCE_THRESHOLD_KM
  const isNearby = nearestBranch.distanceKm <= thresholdKm
  const routingBranch = isNearby
    ? nearestBranch.branch
    : PrismaCotizacionRoutingBranch.lejanos

  return {
    routingBranch,
    routingDistanceKm: roundDistanceKm(nearestBranch.distanceKm),
    routingPostalCodeNormalized: postalCodeNormalized,
    routingLatitude: coordinates.latitude,
    routingLongitude: coordinates.longitude,
    routingProvider: coordinates.provider,
    routingStatus: PrismaCotizacionRoutingStatus.resolved,
    redirectUrl: getRedirectUrlForRoutingBranch(routingBranch)
  }
}
