import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchAdminDashboard,
  loginAdmin,
  logoutAdmin
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
      uso: 'particular',
      cobertura_deseada: 'terceros_completo',
      motivo_contacto: 'cotizacion',
      mensaje: 'Necesito cotizar',
      source_page: 'Cotizacion'
    }
  ],
  siniestros: [],
  totals: {
    cotizaciones: 1,
    siniestros: 0
  }
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

  it('loginAdmin calls /api/admin/login and succeeds on 200', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(makeJsonResponse(200, { ok: true }))

    await expect(loginAdmin('DanielMartinez2001')).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/login', expect.objectContaining({
      method: 'POST',
      credentials: 'include'
    }))
  })

  it('fetchAdminDashboard normalizes limit and returns parsed payload', async () => {
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

  it('fetchAdminDashboard maps 401 to unauthorized message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      makeJsonResponse(401, { error: 'Credenciales inválidas' })
    )

    await expect(fetchAdminDashboard()).rejects.toThrow('No autorizado.')
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
})

