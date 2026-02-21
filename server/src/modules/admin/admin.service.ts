import { randomBytes, createHash } from 'node:crypto'
import { env } from '../../config/env.js'
import { prisma } from '../db/prisma.js'
import type { AdminDashboardResponse, AdminLeadRow } from './admin.types.js'
import { normalizeLimit } from '../../utils/validation/common.js'

export const ADMIN_COOKIE_NAME = 'admin_session'

function hashToken(rawToken: string) {
  return createHash('sha256')
    .update(`${rawToken}:${env.COOKIE_SECRET}`)
    .digest('hex')
}

function mapCotizacionToAdminRow(cotizacion: {
  id: string
  createdAt: Date
  nombre: string
  telefono: string
  email: string | null
  tipoVehiculo: string | null
  marcaModelo: string | null
  anio: string | null
  localidad: string | null
  uso: string | null
  coberturaDeseada: string | null
  mensaje: string | null
  sourcePage: string
}): AdminLeadRow {
  return {
    id: cotizacion.id,
    created_at: cotizacion.createdAt.toISOString(),
    tipo_formulario: 'cotizacion',
    nombre: cotizacion.nombre,
    telefono: cotizacion.telefono,
    email: cotizacion.email,
    tipo_vehiculo: cotizacion.tipoVehiculo,
    marca_modelo: cotizacion.marcaModelo,
    anio: cotizacion.anio,
    localidad: cotizacion.localidad,
    uso: cotizacion.uso,
    cobertura_deseada: cotizacion.coberturaDeseada,
    motivo_contacto: 'cotizacion',
    mensaje: cotizacion.mensaje,
    source_page: cotizacion.sourcePage
  }
}

function mapSiniestroToAdminRow(siniestro: {
  id: string
  createdAt: Date
  nombreReporte: string
  telefono: string
  detalleTexto: string | null
  sourcePage: string
  payloadJson: unknown
}): AdminLeadRow {
  return {
    id: siniestro.id,
    created_at: siniestro.createdAt.toISOString(),
    tipo_formulario: 'contacto',
    nombre: siniestro.nombreReporte,
    telefono: siniestro.telefono,
    email: null,
    tipo_vehiculo: null,
    marca_modelo: null,
    anio: null,
    localidad: null,
    uso: null,
    cobertura_deseada: null,
    motivo_contacto: 'siniestro',
    mensaje:
      siniestro.detalleTexto ??
      (siniestro.payloadJson ? JSON.stringify(siniestro.payloadJson) : null),
    source_page: siniestro.sourcePage
  }
}

export function validateAdminPassword(password: string) {
  return password === env.ADMIN_DASHBOARD_PASSWORD
}

export async function createAdminSession(input: {
  ip?: string
  userAgent?: string
}) {
  const rawToken = randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(
    Date.now() + env.ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000
  )

  await prisma.adminSession.create({
    data: {
      tokenHash,
      expiresAt,
      ip: input.ip,
      userAgent: input.userAgent
    }
  })

  return {
    token: rawToken,
    expiresAt
  }
}

export async function revokeAdminSession(rawToken: string) {
  const tokenHash = hashToken(rawToken)
  await prisma.adminSession.updateMany({
    where: {
      tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  })
}

export async function getActiveAdminSession(rawToken: string) {
  const tokenHash = hashToken(rawToken)
  return prisma.adminSession.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: {
        gt: new Date()
      }
    }
  })
}

export async function getAdminDashboard(rawLimit: unknown): Promise<AdminDashboardResponse> {
  const limit = normalizeLimit(rawLimit, 500, 1000)

  const [cotizaciones, siniestros] = await Promise.all([
    prisma.cotizacion.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    }),
    prisma.siniestro.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  ])

  const cotizacionesRows = cotizaciones.map(mapCotizacionToAdminRow)
  const siniestrosRows = siniestros.map(mapSiniestroToAdminRow)

  return {
    cotizaciones: cotizacionesRows,
    siniestros: siniestrosRows,
    totals: {
      cotizaciones: cotizacionesRows.length,
      siniestros: siniestrosRows.length
    }
  }
}

