import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ContactoForm from './ContactoForm'
import { insertLead } from '../../lib/leads'

vi.mock('../../lib/leads', () => ({
  insertLead: vi.fn()
}))

const mockedInsertLead = vi.mocked(insertLead)

describe('ContactoForm', () => {
  beforeEach(() => {
    mockedInsertLead.mockReset()
  })

  it('envía los datos de contacto al guardar un lead', async () => {
    mockedInsertLead.mockResolvedValue(undefined)

    render(<ContactoForm sourcePage="Contacto" />)

    fireEvent.change(screen.getByLabelText('Nombre *'), {
      target: { value: 'Maria Gomez' }
    })
    fireEvent.change(screen.getByLabelText('WhatsApp *'), {
      target: { value: '11 2222-3333' }
    })
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'cotizacion' }
    })
    fireEvent.change(screen.getByLabelText('Mensaje'), {
      target: { value: 'Necesito una cotización para mi auto.' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    await waitFor(() => {
      expect(mockedInsertLead).toHaveBeenCalledTimes(1)
    })

    expect(mockedInsertLead).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo_formulario: 'contacto',
        nombre: 'Maria Gomez',
        telefono: '11 2222-3333',
        motivo_contacto: 'cotizacion',
        mensaje: 'Necesito una cotización para mi auto.',
        consentimiento: true,
        source_page: 'Contacto'
      })
    )

    expect(await screen.findByText('¡Mensaje enviado!')).toBeInTheDocument()
  })

  it('muestra error cuando la API falla', async () => {
    mockedInsertLead.mockRejectedValue(new Error('network'))

    render(<ContactoForm sourcePage="Contacto" />)

    fireEvent.change(screen.getByLabelText('Nombre *'), {
      target: { value: 'Maria Gomez' }
    })
    fireEvent.change(screen.getByLabelText('WhatsApp *'), {
      target: { value: '11 2222-3333' }
    })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensaje' }))

    expect(
      await screen.findByText('No pudimos enviar tu mensaje. Probá nuevamente.')
    ).toBeInTheDocument()
  })
})
