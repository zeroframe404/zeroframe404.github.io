import {
  CotizacionRoutingBranch as PrismaCotizacionRoutingBranch,
  CotizacionRoutingStatus as PrismaCotizacionRoutingStatus,
  Prisma
} from '@prisma/client'
import { env } from '../../config/env.js'
import { prisma } from '../db/prisma.js'

const NOMINATIM_GEOCODING_ENDPOINT = 'https://nominatim.openstreetmap.org/search'
const GEOCODING_PROVIDER = 'nominatim'
const GEOCODING_TIMEOUT_MS = 4_000
const GEOCODING_MIN_INTERVAL_MS = 1_100
const GEOCODING_CONTACT_EMAIL =
  process.env.GEOCODING_CONTACT_EMAIL?.trim() ||
  process.env.VITE_CONTACT_EMAIL?.trim() ||
  'contacto@segurosdocksud.com'
const GEOCODING_USER_AGENT = `SegurosDockSud/1.0 (${GEOCODING_CONTACT_EMAIL})`

const WHATSAPP_BY_BRANCH: Record<PrismaCotizacionRoutingBranch, string> = {
  avellaneda: '5491140830416',
  lanus: '5491136942482',
  lejanos: '5491140830416'
}

let ensurePostgisPromise: Promise<void> | null = null
let geocodingThrottlePromise: Promise<void> = Promise.resolve()
let nextGeocodingSlotAt = 0

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

function normalizeRoutingBranchForBusiness(
  branch: PrismaCotizacionRoutingBranch
): PrismaCotizacionRoutingBranch {
  return branch === PrismaCotizacionRoutingBranch.lejanos
    ? PrismaCotizacionRoutingBranch.avellaneda
    : branch
}

function roundDistanceKm(value: number) {
  return Math.round(value * 100) / 100
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function buildNominatimGeocodingUrl(postalCodeNormalized: string, useFallbackQuery = false) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: '1',
    addressdetails: '1',
    countrycodes: 'ar',
    'accept-language': 'es',
    email: GEOCODING_CONTACT_EMAIL
  })

  if (useFallbackQuery) {
    params.set('q', `${postalCodeNormalized}, Argentina`)
  } else {
    params.set('postalcode', postalCodeNormalized)
  }

  return `${NOMINATIM_GEOCODING_ENDPOINT}?${params.toString()}`
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

async function fetchNominatimGeocode(
  postalCodeNormalized: string,
  useFallbackQuery = false
): Promise<GeocodingCoordinates | null> {
  await throttleGeocodingRequests()
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => {
    abortController.abort()
  }, GEOCODING_TIMEOUT_MS)

  try {
    const response = await fetch(buildNominatimGeocodingUrl(postalCodeNormalized, useFallbackQuery), {
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
    if (!Array.isArray(payload)) {
      return null
    }

    const firstResult = payload.find((item) => isRecord(item))
    if (!firstResult) {
      return null
    }

    const latitude = asNumber(firstResult.lat)
    const longitude = asNumber(firstResult.lon)

    if (latitude === null || longitude === null) {
      return null
    }

    const formattedAddress =
      typeof firstResult.display_name === 'string'
        ? firstResult.display_name
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

  const fetched =
    (await fetchNominatimGeocode(postalCodeNormalized)) ??
    (await fetchNominatimGeocode(postalCodeNormalized, true))
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
  const fallbackBranch = PrismaCotizacionRoutingBranch.avellaneda

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
    ? normalizeRoutingBranchForBusiness(nearestBranch.branch)
    : PrismaCotizacionRoutingBranch.avellaneda

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
