import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App routing', () => {
  beforeEach(() => {
    window.location.hash = '#/Home'
  })

  it('renderiza la Home cuando la ruta es /Home', async () => {
    render(<App />)
    expect(await screen.findByText('¿Por qué elegirnos?')).toBeInTheDocument()
  })

  it('renderiza Cotizacion cuando la ruta es /Cotizacion', async () => {
    window.location.hash = '#/Cotizacion'
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Pedi tu cotizacion' })
    ).toBeInTheDocument()
  })

  it('renderiza 404 para rutas inexistentes', async () => {
    window.location.hash = '#/RutaInexistente'
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' })
    ).toBeInTheDocument()
  })
})
