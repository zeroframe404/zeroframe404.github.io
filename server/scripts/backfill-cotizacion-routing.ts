import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { resolveCotizacionRouting } from '../src/modules/forms/cotizacion-routing.service.js'

const prisma = new PrismaClient()
const forceMode = process.argv.includes('--force')
const BATCH_SIZE = 200

type CotizacionBatchRow = {
  id: string
  codigoPostal: string | null
  routingBranch: 'avellaneda' | 'lanus' | 'lejanos'
  routingDistanceKm: number | null
  routingPostalCodeNormalized: string | null
  routingLatitude: number | null
  routingLongitude: number | null
  routingProvider: string | null
  routingStatus: 'resolved' | 'fallback_invalid_cp' | 'fallback_geocode_failed'
  routingOverridden: boolean
}

function sameNullableNumber(left: number | null, right: number | null, epsilon = 0.0001) {
  if (left === null || right === null) {
    return left === right
  }

  return Math.abs(left - right) <= epsilon
}

function shouldUpdate(row: CotizacionBatchRow, resolution: Awaited<ReturnType<typeof resolveCotizacionRouting>>) {
  if (row.routingBranch !== resolution.routingBranch) return true
  if (!sameNullableNumber(row.routingDistanceKm, resolution.routingDistanceKm)) return true
  if (row.routingPostalCodeNormalized !== resolution.routingPostalCodeNormalized) return true
  if (!sameNullableNumber(row.routingLatitude, resolution.routingLatitude)) return true
  if (!sameNullableNumber(row.routingLongitude, resolution.routingLongitude)) return true
  if (row.routingProvider !== resolution.routingProvider) return true
  if (row.routingStatus !== resolution.routingStatus) return true
  return false
}

async function run() {
  const startedAt = Date.now()
  let cursorId: string | null = null
  let totalRead = 0
  let totalProcessed = 0
  let totalUpdated = 0
  let totalSkipped = 0
  let totalErrors = 0

  while (true) {
    const rows = await prisma.cotizacion.findMany({
      take: BATCH_SIZE,
      ...(cursorId
        ? {
            skip: 1,
            cursor: {
              id: cursorId
            }
          }
        : {}),
      orderBy: {
        id: 'asc'
      },
      select: {
        id: true,
        codigoPostal: true,
        routingBranch: true,
        routingDistanceKm: true,
        routingPostalCodeNormalized: true,
        routingLatitude: true,
        routingLongitude: true,
        routingProvider: true,
        routingStatus: true,
        routingOverridden: true
      }
    }) as CotizacionBatchRow[]

    if (rows.length === 0) {
      break
    }

    for (const row of rows) {
      totalRead += 1
      cursorId = row.id

      if (row.routingOverridden) {
        totalSkipped += 1
        continue
      }

      if (
        !forceMode &&
        row.routingPostalCodeNormalized &&
        row.routingProvider &&
        row.routingStatus === 'resolved'
      ) {
        totalSkipped += 1
        continue
      }

      totalProcessed += 1

      try {
        const resolution = await resolveCotizacionRouting({
          codigoPostal: row.codigoPostal
        })

        if (!shouldUpdate(row, resolution)) {
          totalSkipped += 1
          continue
        }

        await prisma.cotizacion.update({
          where: {
            id: row.id
          },
          data: {
            routingBranch: resolution.routingBranch,
            routingDistanceKm: resolution.routingDistanceKm,
            routingPostalCodeNormalized: resolution.routingPostalCodeNormalized,
            routingLatitude: resolution.routingLatitude,
            routingLongitude: resolution.routingLongitude,
            routingProvider: resolution.routingProvider,
            routingStatus: resolution.routingStatus
          }
        })

        totalUpdated += 1
      } catch (error) {
        totalErrors += 1
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Error procesando cotizacion ${row.id}: ${message}`)
      }
    }
  }

  const durationMs = Date.now() - startedAt
  const summary = {
    mode: forceMode ? 'force' : 'default',
    totalRead,
    totalProcessed,
    totalUpdated,
    totalSkipped,
    totalErrors,
    durationMs
  }

  try {
    await prisma.adminActivity.create({
      data: {
        actorUserId: null,
        action: 'backfill_cotizacion_routing',
        section: 'cotizaciones',
        description: 'Ejecucion del backfill de sucursal derivada para cotizaciones.',
        metadata: summary
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`No se pudo registrar la actividad de backfill: ${message}`)
  }

  console.log(JSON.stringify(summary, null, 2))
}

run()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
