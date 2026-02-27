import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminHiddenPage from './AdminHiddenPage'
import {
  clearAdminActivities,
  createAdminRole,
  createAdminUser,
  deleteAdminCotizacion,
  deleteAdminRole,
  deleteAdminSiniestro,
  deleteAdminUser,
  fetchAdminAccessControl,
  fetchAdminActivities,
  fetchAdminDashboard,
  fetchAdminSiniestroArchivoBlob,
  fetchAdminSiniestroArchivos,
  loginAdmin,
  logoutAdmin,
  trackAdminView,
  updateAdminLogSettings,
  updateAdminRole,
  updateAdminUser,
  updateSuperAdminCredentials
} from '../lib/adminApi'
import type { AdminDashboardResponse } from '../types/admin'

vi.mock('../lib/adminApi', () => ({
  clearAdminActivities: vi.fn(),
  createAdminRole: vi.fn(),
  createAdminUser: vi.fn(),
  deleteAdminCotizacion: vi.fn(),
  deleteAdminRole: vi.fn(),
  deleteAdminSiniestro: vi.fn(),
  deleteAdminUser: vi.fn(),
  fetchAdminAccessControl: vi.fn(),
  fetchAdminActivities: vi.fn(),
  fetchAdminDashboard: vi.fn(),
  fetchAdminSiniestroArchivoBlob: vi.fn(),
  fetchAdminSiniestroArchivos: vi.fn(),
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  trackAdminView: vi.fn(),
  updateAdminLogSettings: vi.fn(),
  updateAdminRole: vi.fn(),
  updateAdminUser: vi.fn(),
  updateSuperAdminCredentials: vi.fn()
}))

const mockedClearAdminActivities = vi.mocked(clearAdminActivities)
const mockedCreateAdminRole = vi.mocked(createAdminRole)
const mockedCreateAdminUser = vi.mocked(createAdminUser)
const mockedDeleteAdminCotizacion = vi.mocked(deleteAdminCotizacion)
const mockedDeleteAdminRole = vi.mocked(deleteAdminRole)
const mockedDeleteAdminSiniestro = vi.mocked(deleteAdminSiniestro)
const mockedDeleteAdminUser = vi.mocked(deleteAdminUser)
const mockedFetchAdminAccessControl = vi.mocked(fetchAdminAccessControl)
const mockedFetchAdminActivities = vi.mocked(fetchAdminActivities)
const mockedFetchAdminDashboard = vi.mocked(fetchAdminDashboard)
const mockedFetchAdminSiniestroArchivoBlob = vi.mocked(fetchAdminSiniestroArchivoBlob)
const mockedFetchAdminSiniestroArchivos = vi.mocked(fetchAdminSiniestroArchivos)
const mockedLoginAdmin = vi.mocked(loginAdmin)
const mockedLogoutAdmin = vi.mocked(logoutAdmin)
const mockedTrackAdminView = vi.mocked(trackAdminView)
const mockedUpdateAdminLogSettings = vi.mocked(updateAdminLogSettings)
const mockedUpdateAdminRole = vi.mocked(updateAdminRole)
const mockedUpdateAdminUser = vi.mocked(updateAdminUser)
const mockedUpdateSuperAdminCredentials = vi.mocked(updateSuperAdminCredentials)

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
      codigo_postal: '1870',
      uso: 'particular',
      cobertura_deseada: 'todo_riesgo',
      motivo_contacto: 'cotizacion',
      mensaje: 'Quiero cotizar',
      routing_branch: 'avellaneda',
      routing_distance_km: 2.45,
      routing_status: 'resolved',
      routing_overridden: false,
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
      codigo_postal: null,
      uso: null,
      cobertura_deseada: null,
      motivo_contacto: 'siniestro',
      mensaje: 'Detalle del siniestro',
      routing_branch: null,
      routing_distance_km: null,
      routing_status: null,
      routing_overridden: false,
      source_page: 'Siniestros'
    }
  ],
  totals: {
    cotizaciones: 1,
    siniestros: 1
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

describe('AdminHiddenPage', () => {
  beforeEach(() => {
    mockedClearAdminActivities.mockReset()
    mockedCreateAdminRole.mockReset()
    mockedCreateAdminUser.mockReset()
    mockedDeleteAdminCotizacion.mockReset()
    mockedDeleteAdminRole.mockReset()
    mockedDeleteAdminSiniestro.mockReset()
    mockedDeleteAdminUser.mockReset()
    mockedFetchAdminAccessControl.mockReset()
    mockedFetchAdminActivities.mockReset()
    mockedFetchAdminDashboard.mockReset()
    mockedFetchAdminSiniestroArchivoBlob.mockReset()
    mockedFetchAdminSiniestroArchivos.mockReset()
    mockedLoginAdmin.mockReset()
    mockedLogoutAdmin.mockReset()
    mockedTrackAdminView.mockReset()
    mockedTrackAdminView.mockResolvedValue(undefined)
    mockedUpdateAdminLogSettings.mockReset()
    mockedUpdateAdminRole.mockReset()
    mockedUpdateAdminUser.mockReset()
    mockedUpdateSuperAdminCredentials.mockReset()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'prompt').mockReturnValue(null)
  })

  it('renders login form with USER and PASSWORD', () => {
    render(<AdminHiddenPage />)

    expect(screen.getByRole('heading', { name: 'Acceso administrador' })).toBeInTheDocument()
    expect(screen.getByLabelText('USER')).toBeInTheDocument()
    expect(screen.getByLabelText('PASSWORD')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('shows error when login fails', async () => {
    mockedLoginAdmin.mockRejectedValue(new Error('Credenciales invalidas.'))

    render(<AdminHiddenPage />)

    fireEvent.change(screen.getByLabelText('USER'), {
      target: { value: 'Empleado1' }
    })
    fireEvent.change(screen.getByLabelText('PASSWORD'), {
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

    fireEvent.change(screen.getByLabelText('USER'), {
      target: { value: 'Daniel' }
    })
    fireEvent.change(screen.getByLabelText('PASSWORD'), {
      target: { value: 'DockSud1945!#!' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard de envios' })).toBeInTheDocument()
    })

    expect(screen.getByText('Laura Perez')).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Lejanos' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cerrar sesion/i }))
    expect(mockedLogoutAdmin).toHaveBeenCalledTimes(1)

    expect(await screen.findByRole('heading', { name: 'Acceso administrador' })).toBeInTheDocument()
  })

  it('deletes cotizacion when user confirms', async () => {
    mockedLoginAdmin.mockResolvedValue(undefined)
    mockedFetchAdminDashboard.mockResolvedValue(sampleAdminData)
    mockedDeleteAdminCotizacion.mockResolvedValue(undefined)

    render(<AdminHiddenPage />)

    fireEvent.change(screen.getByLabelText('USER'), {
      target: { value: 'Daniel' }
    })
    fireEvent.change(screen.getByLabelText('PASSWORD'), {
      target: { value: 'DockSud1945!#!' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard de envios' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Eliminar/i }))

    await waitFor(() => {
      expect(mockedDeleteAdminCotizacion).toHaveBeenCalledWith('cotizacion-1')
    })
  })

  it('shows cotizacion vehicle fields in detail modal', async () => {
    mockedLoginAdmin.mockResolvedValue(undefined)
    mockedFetchAdminDashboard.mockResolvedValue(sampleAdminData)

    render(<AdminHiddenPage />)

    fireEvent.change(screen.getByLabelText('USER'), {
      target: { value: 'Daniel' }
    })
    fireEvent.change(screen.getByLabelText('PASSWORD'), {
      target: { value: 'DockSud1945!#!' }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard de envios' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ver' }))

    expect(screen.getByText('Tipo de vehiculo')).toBeInTheDocument()
    expect(screen.getByText('Marca / modelo')).toBeInTheDocument()
    expect(screen.getByText('Anio')).toBeInTheDocument()
    expect(screen.getByText('Localidad')).toBeInTheDocument()
    expect(screen.getByText('Uso')).toBeInTheDocument()
    expect(screen.getByText('Cobertura deseada')).toBeInTheDocument()
    expect(screen.getByText('Fiat Cronos')).toBeInTheDocument()
    expect(screen.getByText('2023')).toBeInTheDocument()
  })
})
