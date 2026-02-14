import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App routing', () => {
  beforeEach(() => {
    window.location.hash = '#/Home'
  })

  it('renderiza la Home cuando la ruta es /Home', () => {
    render(<App />)
    expect(screen.getByText('¿Por qué elegirnos?')).toBeInTheDocument()
  })

  it('renderiza Cotización cuando la ruta es /Cotizacion', () => {
    window.location.hash = '#/Cotizacion'
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Pedí tu cotización' })
    ).toBeInTheDocument()
  })

  it('renderiza 404 para rutas inexistentes', () => {
    window.location.hash = '#/RutaInexistente'
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Página no encontrada' })
    ).toBeInTheDocument()
  })
})
