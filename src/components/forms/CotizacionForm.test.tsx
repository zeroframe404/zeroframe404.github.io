import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { insertLead } from '../../lib/leads'
import CotizacionForm from './CotizacionForm'

vi.mock('../../lib/leads', () => ({
  insertLead: vi.fn()
}))

const mockedInsertLead = vi.mocked(insertLead)

describe('CotizacionForm', () => {
  beforeEach(() => {
    mockedInsertLead.mockReset()
  })

  it('envia los datos a Supabase cuando el formulario es valido', async () => {
    mockedInsertLead.mockResolvedValue(undefined)

    render(<CotizacionForm sourcePage="Cotizacion" insuranceType="Autos" />)

    fireEvent.change(screen.getByLabelText('Nombre y apellido *'), {
      target: { value: 'Juan Perez' }
    })
    fireEvent.change(screen.getByLabelText(/Tel.*fono \/ WhatsApp \*/i), {
      target: { value: '11 1111-1111' }
    })
    fireEvent.change(screen.getByLabelText('Localidad *'), {
      target: { value: 'Avellaneda' }
    })
    fireEvent.change(screen.getByLabelText('Codigo postal *'), {
      target: { value: '1870' }
    })
    fireEvent.change(screen.getByLabelText('Marca *'), {
      target: { value: 'Fiat' }
    })
    fireEvent.change(screen.getByLabelText('Modelo *'), {
      target: { value: 'Cronos' }
    })
    fireEvent.change(screen.getByPlaceholderText('Ej: 2022'), {
      target: { value: '2022' }
    })
    fireEvent.change(screen.getByLabelText('Uso *'), {
      target: { value: 'particular' }
    })
    fireEvent.change(screen.getByLabelText('Cobertura deseada *'), {
      target: { value: 'cotizar_todas_companias' }
    })
    fireEvent.click(screen.getByRole('button', { name: /^Si$/i }))
    fireEvent.click(
      screen.getByLabelText(
        /Acepto que me contacten por WhatsApp o llamada para recibir la cotizaci.*n\. \*/i
      )
    )

    fireEvent.click(screen.getByRole('button', { name: /Solicitar Cotizaci.*n/i }))

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
        codigo_postal: '1870',
        uso: 'particular',
        cobertura_deseada: 'cotizar_todas_companias',
        mensaje: 'Es 0KM: Si',
        consentimiento: true,
        source_page: 'Cotizacion'
      })
    )

    expect(await screen.findByText('Envio simulado exitoso')).toBeInTheDocument()
  })

  it('muestra error cuando faltan datos obligatorios', async () => {
    render(<CotizacionForm sourcePage="Cotizacion" insuranceType="Autos" />)

    fireEvent.click(screen.getByRole('button', { name: /Solicitar Cotizaci.*n/i }))

    expect(await screen.findByText(/Complet.*campos obligatorios/i)).toBeInTheDocument()
    expect(mockedInsertLead).not.toHaveBeenCalled()
  })

  it('pide campos de ecomovilidad cuando el seguro es bicicleta', async () => {
    mockedInsertLead.mockResolvedValue(undefined)

    render(<CotizacionForm sourcePage="Cotizacion" insuranceType="Bicicleta" />)

    fireEvent.change(screen.getByLabelText('Nombre y apellido *'), {
      target: { value: 'Ana Gomez' }
    })
    fireEvent.change(screen.getByLabelText(/Tel.*fono \/ WhatsApp \*/i), {
      target: { value: '11 2222-3333' }
    })
    fireEvent.change(screen.getByLabelText('Localidad *'), {
      target: { value: 'Quilmes' }
    })
    fireEvent.change(screen.getByLabelText('Codigo postal *'), {
      target: { value: '1878' }
    })
    fireEvent.change(screen.getByLabelText('Marca *'), {
      target: { value: 'Raleigh' }
    })
    fireEvent.change(screen.getByLabelText('Modelo *'), {
      target: { value: 'Mojave 2.0' }
    })
    fireEvent.change(screen.getByLabelText('Valor en ARS *'), {
      target: { value: '1500000' }
    })
    fireEvent.change(screen.getByLabelText('Rodado *'), {
      target: { value: '29' }
    })
    fireEvent.change(screen.getByLabelText('Cobertura deseada *'), {
      target: { value: 'responsabilidad_civil' }
    })
    fireEvent.click(
      screen.getByLabelText(
        /Acepto que me contacten por WhatsApp o llamada para recibir la cotizaci.*n\. \*/i
      )
    )

    fireEvent.click(screen.getByRole('button', { name: /Solicitar Cotizaci.*n/i }))

    await waitFor(() => {
      expect(mockedInsertLead).toHaveBeenCalledTimes(1)
    })

    expect(mockedInsertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_formulario: 'cotizacion',
        tipo_vehiculo: 'Bicicleta',
        marca_modelo: 'Raleigh Mojave 2.0',
        cobertura_deseada: 'responsabilidad_civil',
        mensaje: 'Valor en ARS: 1500000\nRodado: 29'
      })
    )
  })

  it('en celulares pide marca, modelo y año de fabricacion', async () => {
    mockedInsertLead.mockResolvedValue(undefined)

    render(<CotizacionForm sourcePage="Cotizacion" insuranceType="Celulares" />)

    expect(screen.queryByLabelText('Uso *')).not.toBeInTheDocument()
    expect(screen.queryByText(/0KM/i)).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nombre y apellido *'), {
      target: { value: 'Luis Diaz' }
    })
    fireEvent.change(screen.getByLabelText(/Tel.*fono \/ WhatsApp \*/i), {
      target: { value: '11 3333-4444' }
    })
    fireEvent.change(screen.getByLabelText('Localidad *'), {
      target: { value: 'Lanus' }
    })
    fireEvent.change(screen.getByLabelText('Codigo postal *'), {
      target: { value: '1824' }
    })
    fireEvent.change(screen.getByLabelText('Marca *'), {
      target: { value: 'Samsung' }
    })
    fireEvent.change(screen.getByLabelText('Modelo *'), {
      target: { value: 'Galaxy S23' }
    })
    fireEvent.change(screen.getByLabelText(/A.o de fabricacion \*/i), {
      target: { value: '2023' }
    })
    fireEvent.change(screen.getByLabelText('Cobertura deseada *'), {
      target: { value: 'responsabilidad_civil' }
    })
    fireEvent.click(
      screen.getByLabelText(
        /Acepto que me contacten por WhatsApp o llamada para recibir la cotizaci.*n\. \*/i
      )
    )

    fireEvent.click(screen.getByRole('button', { name: /Solicitar Cotizaci.*n/i }))

    await waitFor(() => {
      expect(mockedInsertLead).toHaveBeenCalledTimes(1)
    })

    expect(mockedInsertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_formulario: 'cotizacion',
        tipo_vehiculo: 'Celulares',
        marca_modelo: 'Samsung Galaxy S23',
        anio: '2023',
        uso: undefined
      })
    )
  })

  it('para seguros no soportados muestra solo boton a WhatsApp de Avellaneda', () => {
    render(<CotizacionForm sourcePage="Cotizacion" insuranceType="Vivienda" />)

    expect(screen.queryByLabelText('Nombre y apellido *')).not.toBeInTheDocument()

    const button = screen.getByRole('link', {
      name: 'Contactanos por whatsapp para cotizar este seguro'
    })

    expect(button).toHaveAttribute('href')
    expect(button.getAttribute('href')).toContain('https://wa.me/5491140830416')
  })
})
