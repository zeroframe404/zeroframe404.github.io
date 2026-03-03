// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  findVehicleCategoryByCode,
  findVehicleCategoryByText,
  getVehicleCategories,
  isVehicleCategoryCode
} from './vehicle-categories.service.js'

describe('vehicle categories catalog', () => {
  it('returns the configured categories in stable order', () => {
    const categories = getVehicleCategories()

    expect(categories).toHaveLength(18)
    expect(categories[0]).toEqual({ code: 'autos', label: 'Autos' })
    expect(categories[17]).toEqual({
      code: 'autos_funerarios',
      label: 'Autos funerarios'
    })
    expect(new Set(categories.map((item) => item.code)).size).toBe(categories.length)
  })

  it('resolves categories by text aliases and accent-insensitive values', () => {
    expect(findVehicleCategoryByText('camion/transporte pesado')?.code).toBe(
      'camion_transporte_pesado'
    )
    expect(findVehicleCategoryByText('Ómnibus')?.code).toBe('omnibus')
    expect(findVehicleCategoryByText('trailer')?.code).toBe('remolque_trailer_acoplado')
    expect(findVehicleCategoryByText('  bicicleta electrica  ')?.code).toBe('bicicleta')
  })

  it('exposes code helpers for future integrations', () => {
    expect(isVehicleCategoryCode('moto')).toBe(true)
    expect(isVehicleCategoryCode('catamaran')).toBe(false)
    expect(findVehicleCategoryByCode('coche_de_policia')?.label).toBe('Coche de Policia')
  })

  it('returns null for non matching values', () => {
    expect(findVehicleCategoryByText('')).toBeNull()
    expect(findVehicleCategoryByText('seguro de notebook')).toBeNull()
    expect(findVehicleCategoryByText(undefined)).toBeNull()
  })
})
