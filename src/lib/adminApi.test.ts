import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteAdminCotizacion,
  deleteAdminSiniestro,
  fetchAdminSiniestroArchivoBlob,
  fetchAdminSiniestroArchivos,
  fetchAdminDashboard,
  loginAdmin,
  logoutAdmin,
  trackAdminView
} from './adminApi'
import type { AdminDashboardResponse } from '../types/admin'

const sampleDashboardResponse: AdminDashboardResponse = {
  cotizaciones: [
    {
      id: 'cotizacion-1',
      created_at: '2026-02-21T12:00:00.000Z',
      tipo_formulario: 'cotizacion',
      nombre: 'Maria',
      telefono: '11 1234 5678',
      email: 'maria@example.com',
      tipo_vehiculo: 'Autos',
      marca_modelo: 'Fiat Cronos',
      anio: '2022',
      localidad: 'Avellaneda',
      codigo_postal: '1870',
      uso: 'particular',
      cobertura_deseada: 'terceros_completo',
      motivo_contacto: 'cotizacion',
      mensaje: 'Necesito cotizar',
      routing_branch: 'avellaneda',
      routing_distance_km: 2.1,
      routing_status: 'resolved',
      routing_overridden: false,
      source_page: 'Cotizacion'
    }
  ],
  siniestros: [],
  totals: {
    cotizaciones: 1,
    siniestros: 0
  },
  current_user: {
    id: 'user-1',
    username: 'Daniel',
    is_super_admin: true,
    role_id: null,
    role_name: null
  },
  permissions: {
    can_view_cotizaciones: true,
    can_delete_cotizaciones: true,
    can_view_siniestros: true,
    can_delete_siniestros: true
  },
  can_manage_access: true,
  can_view_activities: true
}

const sampleSiniestroFilesPayload = {
  archivos: [
    {
      id: 'file-1',
      created_at: '2026-02-21T12:00:00.000Z',
      label: 'Danos del vehiculo',
      original_name: 'foto-frente.jpg',
      mime_type: 'image/jpeg',
      size_bytes: 153600,
      is_image: true
    }
  ]
}

function makeJsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json'
    }
  })
}

describe('adminApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loginAdmin calls /api/admin/login with username+password', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, { ok: true }))

    await expect(loginAdmin('Daniel', 'DockSud1945!#!')).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/login', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ username: 'Daniel', password: 'DockSud1945!#!' })
    }))
  })

  it('fetchAdminDashboard returns parsed payload', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, sampleDashboardResponse))

    await expect(fetchAdminDashboard(1200)).resolves.toEqual(sampleDashboardResponse)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/dashboard?limit=1000',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include'
      })
    )
  })

  it('logoutAdmin calls /api/admin/logout', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, { ok: true }))

    await expect(logoutAdmin()).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/logout', expect.objectContaining({
      method: 'POST',
      credentials: 'include'
    }))
  })

  it('trackAdminView calls track endpoint', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, { ok: true }))

    await expect(trackAdminView({ section: 'cotizaciones', targetId: 'cotizacion-1' })).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/track-view',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    )
  })

  it('fetchAdminSiniestroArchivos returns parsed files payload', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, sampleSiniestroFilesPayload))

    await expect(fetchAdminSiniestroArchivos('siniestro-1')).resolves.toEqual(
      sampleSiniestroFilesPayload.archivos
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/siniestros/siniestro-1/archivos',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include'
      })
    )
  })

  it('fetchAdminSiniestroArchivoBlob returns blob for download', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('binary-content', {
        status: 200,
        headers: {
          'content-type': 'application/octet-stream'
        }
      })
    )

    const blob = await fetchAdminSiniestroArchivoBlob({
      siniestroId: 'siniestro-1',
      fileId: 'file-1',
      download: true
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/siniestros/siniestro-1/archivos/file-1?download=1',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include'
      })
    )
  })

  it('deleteAdminCotizacion calls DELETE endpoint', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, { ok: true }))

    await expect(deleteAdminCotizacion('cotizacion-1')).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/cotizaciones/cotizacion-1',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include'
      })
    )
  })

  it('deleteAdminSiniestro calls DELETE endpoint', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, { ok: true }))

    await expect(deleteAdminSiniestro('siniestro-1')).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/siniestros/siniestro-1',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include'
      })
    )
  })
})
