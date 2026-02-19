import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import ContactoPage from './ContactoPage'

describe('ContactoPage', () => {
  it('carga los mapas solo cuando el usuario lo solicita', () => {
    render(
      <MemoryRouter>
        <ContactoPage />
      </MemoryRouter>
    )

    expect(screen.queryByTitle(/Mapa /i)).not.toBeInTheDocument()

    const mapButtons = screen.getAllByRole('button', { name: 'Ver mapa' })
    fireEvent.click(mapButtons[0])

    expect(screen.getByTitle('Mapa Avellaneda')).toBeInTheDocument()
    expect(screen.queryByTitle('Mapa Lanus')).not.toBeInTheDocument()
  })
})
