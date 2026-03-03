export const VEHICLE_CATEGORY_DEFINITIONS = [
  {
    code: 'autos',
    label: 'Autos',
    aliases: ['auto']
  },
  {
    code: 'furgon_utilitario_liviano',
    label: 'Furg\u00f3n/Utilitario liviano',
    aliases: ['furgon', 'utilitario', 'utilitario liviano']
  },
  {
    code: 'camion_transporte_pesado',
    label: 'Cami\u00f3n/Transporte pesado',
    aliases: ['camion', 'transporte pesado']
  },
  {
    code: 'omnibus',
    label: '\u00d3mnibus',
    aliases: ['omnibus']
  },
  {
    code: 'micro',
    label: 'Micro',
    aliases: ['microbus']
  },
  {
    code: 'colectivo',
    label: 'Colectivo',
    aliases: ['bus']
  },
  {
    code: 'moto',
    label: 'Moto',
    aliases: ['motos', 'motocicleta']
  },
  {
    code: 'bicicleta',
    label: 'Bicicleta',
    aliases: ['bicicletas', 'bicicleta electrica', 'bicicleta de competicion']
  },
  {
    code: 'remolque_trailer_acoplado',
    label: 'Remolque / Trailer / Acoplado',
    aliases: ['remolque', 'trailer', 'acoplado']
  },
  {
    code: 'monopatin_electrico',
    label: 'Monopat\u00edn el\u00e9ctrico',
    aliases: ['monopatin', 'scooter electrico']
  },
  {
    code: 'casa_rodante_motorhome_trailer_vivienda',
    label: 'Casa rodante / Motorhome / Trailer vivienda',
    aliases: ['casa rodante', 'motorhome', 'trailer vivienda']
  },
  {
    code: 'maquinaria_vial_construccion',
    label: 'Maquinaria Vial/Construcci\u00f3n',
    aliases: ['maquinaria vial', 'maquinaria construccion']
  },
  {
    code: 'maquinaria_agricola',
    label: 'Maquinaria agr\u00edcola',
    aliases: ['maquinaria agricola']
  },
  {
    code: 'ambulancia',
    label: 'Ambulancia',
    aliases: []
  },
  {
    code: 'coche_de_bomberos',
    label: 'Coche de Bomberos',
    aliases: ['bomberos', 'autobomba']
  },
  {
    code: 'coche_de_policia',
    label: 'Coche de Policia',
    aliases: ['policia', 'patrullero']
  },
  {
    code: 'blindados',
    label: 'Blindados',
    aliases: ['blindado']
  },
  {
    code: 'autos_funerarios',
    label: 'Autos funerarios',
    aliases: ['auto funerario']
  }
] as const

export type VehicleCategoryCode = (typeof VEHICLE_CATEGORY_DEFINITIONS)[number]['code']

export interface VehicleCategoryRow {
  code: VehicleCategoryCode
  label: string
}

function normalizeVehicleCategoryText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const categoryByCode = new Map<VehicleCategoryCode, VehicleCategoryRow>(
  VEHICLE_CATEGORY_DEFINITIONS.map((entry) => [
    entry.code,
    {
      code: entry.code,
      label: entry.label
    }
  ])
)

const categoryCodeByLookupText = (() => {
  const index = new Map<string, VehicleCategoryCode>()

  for (const entry of VEHICLE_CATEGORY_DEFINITIONS) {
    const terms = [entry.code, entry.label, ...entry.aliases]

    for (const term of terms) {
      const normalized = normalizeVehicleCategoryText(term)
      if (normalized.length > 0) {
        index.set(normalized, entry.code)
      }
    }
  }

  return index
})()

export function getVehicleCategories() {
  return VEHICLE_CATEGORY_DEFINITIONS.map((entry) => ({
    code: entry.code,
    label: entry.label
  }))
}

export function isVehicleCategoryCode(value: unknown): value is VehicleCategoryCode {
  if (typeof value !== 'string') {
    return false
  }

  return categoryByCode.has(value as VehicleCategoryCode)
}

export function findVehicleCategoryByCode(code: VehicleCategoryCode) {
  return categoryByCode.get(code) ?? null
}

export function findVehicleCategoryByText(rawValue: unknown) {
  if (typeof rawValue !== 'string') {
    return null
  }

  const normalized = normalizeVehicleCategoryText(rawValue)
  if (!normalized) {
    return null
  }

  const code = categoryCodeByLookupText.get(normalized)
  if (!code) {
    return null
  }

  return findVehicleCategoryByCode(code)
}
