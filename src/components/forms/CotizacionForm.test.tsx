import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CotizacionForm from './CotizacionForm'
import { insertLead } from '../../lib/leads'

vi.mock('../../lib/leads', () => ({
  insertLead: vi.fn()
}))

const mockedInsertLead = vi.mocked(insertLead)

describe('CotizacionForm', () => {
  beforeEach(() => {
    mockedInsertLead.mockReset()
  })

  it('envía los datos a Supabase cuando el formulario es válido', async () => {
    mockedInsertLead.mockResolvedValue(undefined)

    render(<CotizacionForm sourcePage="Cotizacion" insuranceType="Autos" />)
    fireEvent.change(screen.getByLabelText('Nombre y apellido *'), {
      target: { value: 'Juan Perez' }
    })
    fireEvent.change(screen.getByLabelText('Teléfono / WhatsApp *'), {
      target: { value: '11 1111-1111' }
    })
    fireEvent.change(screen.getByLabelText('Marca y modelo *'), {
      target: { value: 'Fiat Cronos' }
    })
    fireEvent.change(screen.getByLabelText('Año *'), { target: { value: '2022' } })
    fireEvent.change(screen.getByLabelText('Localidad *'), {
      target: { value: 'Avellaneda' }
    })
    fireEvent.click(
      screen.getByLabelText(
        'Acepto que me contacten por WhatsApp o llamada para recibir la cotización. *'
      )
    )

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cotización' }))

    await waitFor(() => {
      expect(mockedInsertLead).toHaveBeenCalledTimes(1)
    })

    expect(mockedInsertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_formulario: 'cotizacion',
        nombre: 'Juan Perez',
        telefono: '11 1111-1111',
        tipo_vehiculo: 'Autos',
        marca_modelo: 'Fiat Cronos',
        anio: '2022',
        localidad: 'Avellaneda',
        consentimiento: true,
        source_page: 'Cotizacion'
      })
    )

    expect(await screen.findByText('¡Listo!')).toBeInTheDocument()
  })

  it('muestra error cuando faltan datos obligatorios', async () => {
    render(<CotizacionForm sourcePage="Cotizacion" />)

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar Cotización' }))

    expect(
      await screen.findByText('Completá todos los campos obligatorios para continuar.')
    ).toBeInTheDocument()
    expect(mockedInsertLead).not.toHaveBeenCalled()
  })
})
