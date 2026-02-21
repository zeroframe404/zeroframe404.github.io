import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type ViteEnvMap = Record<string, string | boolean | undefined>

const envMap = import.meta.env as ViteEnvMap
const originalHiddenPath = envMap.VITE_ADMIN_HIDDEN_PATH

async function renderApp(hash: string, hiddenPath = originalHiddenPath ?? null) {
  if (hiddenPath === null) {
    delete envMap.VITE_ADMIN_HIDDEN_PATH
  } else {
    envMap.VITE_ADMIN_HIDDEN_PATH = hiddenPath
  }

  window.location.hash = hash
  vi.resetModules()

  const { default: App } = await import('./App')
  render(<App />)
}

describe('App routing', () => {
  beforeEach(() => {
    window.location.hash = '#/Home'
  })

  afterEach(() => {
    cleanup()

    if (originalHiddenPath === undefined) {
      delete envMap.VITE_ADMIN_HIDDEN_PATH
    } else {
      envMap.VITE_ADMIN_HIDDEN_PATH = originalHiddenPath
    }
  })

  it('renderiza Home cuando la ruta es /Home', async () => {
    await renderApp('#/Home')
    expect(
      await screen.findByText(/por qu.*elegirnos\?/i)
    ).toBeInTheDocument()
  })

  it('renderiza Cotizacion cuando la ruta es /Cotizacion', async () => {
    await renderApp('#/Cotizacion')
    expect(
      await screen.findByRole('heading', { name: /pedi tu cotizacion/i })
    ).toBeInTheDocument()
  })

  it('renderiza 404 para rutas inexistentes', async () => {
    await renderApp('#/RutaInexistente')
    expect(
      await screen.findByRole('heading', { name: /p.gina no encontrada/i })
    ).toBeInTheDocument()
  })

  it('renderiza el admin oculto cuando VITE_ADMIN_HIDDEN_PATH esta configurado', async () => {
    await renderApp('#/panel-dm-9k3f2', 'panel-dm-9k3f2')

    expect(
      await screen.findByRole('heading', { name: /acceso administrador/i })
    ).toBeInTheDocument()
  })

  it('cae en 404 para la ruta admin cuando VITE_ADMIN_HIDDEN_PATH no esta configurado', async () => {
    await renderApp('#/panel-dm-9k3f2', null)

    expect(
      await screen.findByRole('heading', { name: /p.gina no encontrada/i })
    ).toBeInTheDocument()
  })
})
