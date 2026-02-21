import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

type LegacyLeadRow = {
  id: string
  created_at: string
  tipo_formulario: string
  nombre: string | null
  telefono: string | null
  email: string | null
  tipo_vehiculo: string | null
  marca_modelo: string | null
  anio: string | null
  localidad: string | null
  codigo_postal?: string | null
  uso: string | null
  cobertura_deseada: string | null
  motivo_contacto: string | null
  mensaje: string | null
  consentimiento: boolean | null
  source_page: string | null
}

const prisma = new PrismaClient()

const supabaseUrl =
  process.env.MIGRATION_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const supabaseServiceKey =
  process.env.MIGRATION_SUPABASE_SERVICE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing MIGRATION_SUPABASE_URL/MIGRATION_SUPABASE_SERVICE_KEY for migration.'
  )
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

const BATCH_SIZE = 500
const dryRun = process.argv.includes('--dry-run')

function extractUrls(text: string | null | undefined) {
  if (!text) return []
  return Array.from(new Set(text.match(/https?:\/\/[^\s)]+/g) ?? []))
}

async function saveRejections(errors: string[]) {
  if (errors.length === 0) return

  const outputDir = path.resolve('server/scripts/output')
  await fs.mkdir(outputDir, { recursive: true })
  const filePath = path.join(outputDir, `migration-rejections-${Date.now()}.csv`)
  const csv = ['error']
    .concat(errors.map((error) => `"${error.replace(/"/g, '""')}"`))
    .join('\n')
  await fs.writeFile(filePath, csv, 'utf8')
}

async function run() {
  let from = 0
  let importedCotizaciones = 0
  let importedContactos = 0
  let importedSiniestros = 0
  const errors: string[] = []

  while (true) {
    const to = from + BATCH_SIZE - 1
    const { data, error } = await supabase
      .from('leads')
      .select(
        'id,created_at,tipo_formulario,nombre,telefono,email,tipo_vehiculo,marca_modelo,anio,localidad,codigo_postal,uso,cobertura_deseada,motivo_contacto,mensaje,consentimiento,source_page'
      )
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) {
      throw new Error(`Supabase read error: ${error.message}`)
    }

    const rows = (data ?? []) as LegacyLeadRow[]
    if (rows.length === 0) break

    for (const row of rows) {
      try {
        const createdAt = row.created_at ? new Date(row.created_at) : new Date()

        if (row.tipo_formulario === 'cotizacion') {
          if (!dryRun) {
            await prisma.cotizacion.create({
              data: {
                createdAt,
                nombre: row.nombre ?? '',
                telefono: row.telefono ?? '',
                email: row.email,
                tipoVehiculo: row.tipo_vehiculo,
                marcaModelo: row.marca_modelo,
                anio: row.anio,
                localidad: row.localidad,
                codigoPostal: row.codigo_postal ?? null,
                uso: row.uso,
                coberturaDeseada: row.cobertura_deseada,
                mensaje: row.mensaje,
                consentimiento: Boolean(row.consentimiento),
                sourcePage: row.source_page ?? 'Cotizacion'
              }
            })
          }

          importedCotizaciones += 1
          continue
        }

        if (row.motivo_contacto === 'siniestro') {
          const reportId = `legacy-${row.id}`
          const urls = extractUrls(row.mensaje)

          if (!dryRun) {
            await prisma.$transaction(async (tx) => {
              const siniestro = await tx.siniestro.create({
                data: {
                  createdAt,
                  tipo: 'choque',
                  nombreReporte: row.nombre || 'Reporte de siniestro',
                  telefono: row.telefono || 'No informado',
                  motivoContacto: 'siniestro',
                  detalleTexto: row.mensaje,
                  payloadJson: {
                    legacyLeadId: row.id,
                    reportId
                  },
                  sourcePage: row.source_page ?? 'Siniestros'
                }
              })

              if (urls.length > 0) {
                await tx.siniestroArchivo.createMany({
                  data: urls.map((url) => ({
                    siniestroId: siniestro.id,
                    label: 'Migrado desde mensaje',
                    originalName: path.basename(url.split('?')[0] ?? 'archivo'),
                    mimeType: 'application/octet-stream',
                    sizeBytes: 0,
                    storageMode: 's3',
                    s3Key: `legacy-url:${url}`,
                    publicUrl: url
                  }))
                })
              }
            })
          }

          importedSiniestros += 1
          continue
        }

        if (!dryRun) {
          await prisma.contacto.create({
            data: {
              createdAt,
              nombre: row.nombre ?? '',
              telefono: row.telefono ?? '',
              motivoContacto: row.motivo_contacto,
              mensaje: row.mensaje,
              consentimiento: Boolean(row.consentimiento),
              sourcePage: row.source_page ?? 'Contacto'
            }
          })
        }

        importedContactos += 1
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'unknown error'
        errors.push(`legacy_id=${row.id}; ${message}`)
      }
    }

    from += rows.length
  }

  await saveRejections(errors)

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'write',
        importedCotizaciones,
        importedContactos,
        importedSiniestros,
        rejectedRows: errors.length
      },
      null,
      2
    )
  )
}

run()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
