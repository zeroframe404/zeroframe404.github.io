import { createHash, randomUUID } from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { env } from '../../config/env.js'
import { prisma } from '../db/prisma.js'
import { uploadSiniestroFile } from '../storage/s3Client.js'
import { asOptionalString, asString } from '../../utils/validation/common.js'
import {
  isAllowedFileMimeType,
  MAX_FILE_SIZE_BYTES,
  MAX_SINIESTRO_FILES
} from '../../utils/validation/files.js'
import { resolveCotizacionRouting } from './cotizacion-routing.service.js'

const siniestroUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_SINIESTRO_FILES
  }
})

const siniestroTypes = new Set(['choque', 'rotura', 'robo', 'incendio'] as const)
type SiniestroType = 'choque' | 'rotura' | 'robo' | 'incendio'

function parseOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
  }

  return undefined
}

function sanitizeFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase()
  const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${baseName}${ext}`
}

function parsePayloadJson(value: unknown) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }

  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

function resolveFileLabels(rawLabels: unknown, fileCount: number) {
  if (Array.isArray(rawLabels)) {
    return rawLabels.map((item) => asString(item))
  }

  if (typeof rawLabels === 'string' && fileCount === 1) {
    return [asString(rawLabels)]
  }

  return []
}

function calculateSha256(content: Buffer) {
  return createHash('sha256').update(content).digest('hex')
}

function toPrismaBytes(content: Buffer) {
  return new Uint8Array(content)
}

export const formsRouter = Router()

formsRouter.post('/cotizaciones', async (req, res) => {
  const telefono = asString(req.body?.telefono)
  if (!telefono) {
    res.status(400).json({ error: 'El telefono es obligatorio.' })
    return
  }

  const consentimiento = parseOptionalBoolean(req.body?.consentimiento)
  if (consentimiento !== true && consentimiento !== false) {
    res.status(400).json({ error: 'El consentimiento es obligatorio.' })
    return
  }

  const codigoPostal = asOptionalString(req.body?.codigo_postal) ?? null
  const routingResolution = await resolveCotizacionRouting({
    codigoPostal
  })

  const inserted = await prisma.cotizacion.create({
    data: {
      nombre: asString(req.body?.nombre),
      telefono,
      email: asOptionalString(req.body?.email) ?? null,
      tipoVehiculo: asOptionalString(req.body?.tipo_vehiculo) ?? null,
      marcaModelo: asOptionalString(req.body?.marca_modelo) ?? null,
      anio: asOptionalString(req.body?.anio) ?? null,
      localidad: asOptionalString(req.body?.localidad) ?? null,
      codigoPostal,
      uso: asOptionalString(req.body?.uso) ?? null,
      coberturaDeseada: asOptionalString(req.body?.cobertura_deseada) ?? null,
      mensaje: asOptionalString(req.body?.mensaje) ?? null,
      consentimiento,
      sourcePage: asString(req.body?.source_page) || 'Cotizacion',
      routingBranch: routingResolution.routingBranch,
      routingDistanceKm: routingResolution.routingDistanceKm,
      routingPostalCodeNormalized: routingResolution.routingPostalCodeNormalized,
      routingLatitude: routingResolution.routingLatitude,
      routingLongitude: routingResolution.routingLongitude,
      routingProvider: routingResolution.routingProvider,
      routingStatus: routingResolution.routingStatus
    }
  })

  res.status(201).json({
    ok: true,
    id: inserted.id,
    routing_branch: routingResolution.routingBranch,
    routing_distance_km: routingResolution.routingDistanceKm,
    routing_status: routingResolution.routingStatus,
    redirect_url: routingResolution.redirectUrl
  })
})

formsRouter.post('/contacto', async (req, res) => {
  const nombre = asString(req.body?.nombre)
  const telefono = asString(req.body?.telefono)

  if (!nombre || !telefono) {
    res.status(400).json({ error: 'Nombre y telefono son obligatorios.' })
    return
  }

  const consentimiento = parseOptionalBoolean(req.body?.consentimiento)
  if (consentimiento !== true && consentimiento !== false) {
    res.status(400).json({ error: 'El consentimiento es obligatorio.' })
    return
  }

  const inserted = await prisma.contacto.create({
    data: {
      nombre,
      telefono,
      motivoContacto: asOptionalString(req.body?.motivo_contacto) ?? null,
      mensaje: asOptionalString(req.body?.mensaje) ?? null,
      consentimiento,
      sourcePage: asString(req.body?.source_page) || 'Contacto'
    }
  })

  res.status(201).json({
    ok: true,
    id: inserted.id
  })
})

formsRouter.post(
  '/siniestros/:tipo',
  siniestroUpload.array('files', MAX_SINIESTRO_FILES),
  async (req, res) => {
    const rawTipo = asString(req.params.tipo).toLowerCase()
    if (!siniestroTypes.has(rawTipo as SiniestroType)) {
      res.status(400).json({ error: 'Tipo de siniestro invalido.' })
      return
    }

    const files = Array.isArray(req.files) ? req.files : []
    const fileLabels = resolveFileLabels(req.body.file_labels, files.length)

    for (const file of files) {
      if (!isAllowedFileMimeType(file.mimetype)) {
        res.status(400).json({ error: 'Tipo de archivo no permitido.' })
        return
      }
    }

    const siniestroId = randomUUID()
    const sourcePage = asString(req.body.source_page) || 'Siniestros'
    const nombreReporte = asString(req.body.nombre_reporte) || 'Reporte de siniestro'
    const telefono = asString(req.body.telefono) || 'No informado'
    const detalleTexto = asOptionalString(req.body.detalle_texto) ?? null
    const payloadJson = parsePayloadJson(req.body.payload_json)
    const storageMode = env.SINIESTRO_FILE_STORAGE
    const shouldStoreInDb = storageMode === 'db' || storageMode === 'dual'
    const shouldUploadToS3 = storageMode === 's3' || storageMode === 'dual'

    const uploadedFiles = await Promise.all(
      files.map(async (file, index) => {
        const label = fileLabels[index] || 'Adjunto'
        let s3Key: string | undefined
        let publicUrl: string | undefined

        if (shouldUploadToS3) {
          const safeFileName = sanitizeFileName(file.originalname)
          const key = `${rawTipo}/${siniestroId}/${Date.now()}-${index + 1}-${safeFileName}`

          try {
            const uploaded = await uploadSiniestroFile({
              key,
              body: file.buffer,
              contentType: file.mimetype
            })
            s3Key = uploaded.key
            publicUrl = uploaded.publicUrl
          } catch (error) {
            if (storageMode === 's3') {
              throw error
            }
          }
        }

        return {
          label,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageMode,
          s3Key,
          publicUrl,
          fileData: shouldStoreInDb ? toPrismaBytes(file.buffer) : undefined,
          fileSha256: shouldStoreInDb ? calculateSha256(file.buffer) : undefined
        }
      })
    )

    await prisma.$transaction([
      prisma.siniestro.create({
        data: {
          id: siniestroId,
          tipo: rawTipo as SiniestroType,
          nombreReporte,
          telefono,
          motivoContacto: 'siniestro',
          detalleTexto,
          payloadJson,
          sourcePage
        }
      }),
      ...(uploadedFiles.length > 0
        ? uploadedFiles.map((item) =>
            prisma.siniestroArchivo.create({
              data: {
                siniestroId,
                label: item.label,
                originalName: item.originalName,
                mimeType: item.mimeType,
                sizeBytes: item.sizeBytes,
                storageMode: item.storageMode,
                s3Key: item.s3Key,
                publicUrl: item.publicUrl,
                fileData: item.fileData,
                fileSha256: item.fileSha256
              }
            })
          )
        : [])
    ])

    res.status(201).json({
      ok: true,
      id: siniestroId
    })
  }
)
