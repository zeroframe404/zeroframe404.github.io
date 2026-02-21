import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminHiddenPage from './AdminHiddenPage'
import {
  fetchAdminDashboard,
  loginAdmin,
  logoutAdmin
} from '../lib/adminApi'
import type { AdminDashboardResponse } from '../types/admin'

vi.mock('../lib/adminApi', () => ({
  fetchAdminDashboard: vi.fn(),
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn()
}))

const mockedFetchAdminDashboard = vi.mocked(fetchAdminDashboard)
const mockedLoginAdmin = vi.mocked(loginAdmin)
const mockedLogoutAdmin = vi.mocked(logoutAdmin)

const sampleAdminData: AdminDashboardResponse = {
  cotizaciones: [
    {
      id: 'cotizacion-1',
      created_at: '2026-02-21T12:00:00.000Z',
      tipo_formulario: 'cotizacion',
      nombre: 'Laura Perez',
      telefono: '11 1111 2222',
      email: 'laura@example.com',
      tipo_vehiculo: 'Autos',
      marca_modelo: 'Fiat Cronos',
      anio: '2023',
      localidad: 'Avellaneda',
      uso: 'particular',
      cobertura_deseada: 'todo_riesgo',
      motivo_contacto: 'cotizacion',
      mensaje: 'Quiero cotizar',
      source_page: 'Cotizacion'
    }
  ],
  siniestros: [
    {
      id: 'siniestro-1',
      created_at: '2026-02-20T12:00:00.000Z',
      tipo_formulario: 'contacto',
      nombre: 'Reporte de siniestro',
      telefono: 'No informado',
      email: null,
      tipo_vehiculo: null,
      marca_modelo: null,
      anio: null,
      localidad: null,
      uso: null,
      cobertura_deseada: null,
      motivo_contacto: 'siniestro',
      mensaje: 'Detalle del siniestro',
      source_page: 'Siniestros'
    }
  ],
  totals: {
    cotizaciones: 1,
    siniestros: 1
  }
}

describe('AdminHiddenPage', () => {
  beforeEach(() => {
    mockedLoginAdmin.mockReset()
    mockedFetchAdminDashboard.mockReset()
    mockedLogoutAdmin.mockReset()
  })

  it('renders login form initially', () => {
    render(<AdminHiddenPage />)

    expect(
      screen.getByRole('heading', { name: 'Acceso administrador' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Contrasena')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('shows error when login fails', async () => {
    mockedLoginAdmin.mockRejectedValue(new Error('Credenciales invalidas.'))

    render(<AdminHiddenPage />)

    fireEvent.change(screen.getByLabelText('Contrasena'), {
      target: { value: 'password-incorrecta' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Credenciales invalidas.')).toBeInTheDocument()
  })

  it('shows dashboard after successful login and allows logout', async () => {
    mockedLoginAdmin.mockResolvedValue(undefined)
    mockedFetchAdminDashboard.mockResolvedValue(sampleAdminData)
    mockedLogoutAdmin.mockResolvedValue(undefined)

    render(<AdminHiddenPage />)

    fireEvent.change(screen.getByLabelText('Contrasena'), {
      target: { value: 'DanielMartinez2001' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Dashboard de envios' })
      ).toBeInTheDocument()
    })

    expect(screen.getByText('Laura Perez')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 1 registro de cotizaciones.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesion/i }))
    expect(mockedLogoutAdmin).toHaveBeenCalledTimes(1)

    expect(
      await screen.findByRole('heading', { name: 'Acceso administrador' })
    ).toBeInTheDocument()
  })
})
