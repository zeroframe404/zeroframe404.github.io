import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { insertLead } from '../../lib/leads'
import SimulatedSuccessBadge from './SimulatedSuccessBadge'

interface CotizacionFormValues {
  tipo_vehiculo: string
  nombre: string
  telefono: string
  email: string
  codigo_postal: string
  cantidad_personas: string
  tipo_trabajo: string
  tiempo_uso_seguro: string
  clausula_no_repeticion: '' | 'si' | 'no'
  es_cero_km: '' | 'si' | 'no'
  valor_ars: string
  fecha_compra: string
  rodado: string
  marca: string
  modelo: string
  patente: string
  anio: string
  localidad: string
  uso: string
  cobertura_deseada: string
  mensaje: string
  consentimiento: boolean
}

const buildInitialValues = (insuranceType?: string): CotizacionFormValues => ({
  tipo_vehiculo: insuranceType ?? '',
  nombre: '',
  telefono: '',
  email: '',
  codigo_postal: '',
  cantidad_personas: '',
  tipo_trabajo: '',
  tiempo_uso_seguro: '',
  clausula_no_repeticion: '',
  es_cero_km: '',
  valor_ars: '',
  fecha_compra: '',
  rodado: '',
  marca: '',
  modelo: '',
  patente: '',
  anio: '',
  localidad: '',
  uso: '',
  cobertura_deseada: '',
  mensaje: '',
  consentimiento: false
})

interface CotizacionFormProps {
  sourcePage?: string
  insuranceType?: string
}

const AVELLANEDA_WHATSAPP_NUMBER = '5491140830416'

export default function CotizacionForm({
  sourcePage = 'Cotizacion',
  insuranceType
}: CotizacionFormProps) {
  const [values, setValues] = useState<CotizacionFormValues>(() => buildInitialValues(insuranceType))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <T extends keyof CotizacionFormValues>(
    field: T,
    value: CotizacionFormValues[T]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const normalizedInsuranceType = values.tipo_vehiculo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const isEcomovilityInsurance =
    normalizedInsuranceType.includes('bicicleta') || normalizedInsuranceType.includes('monopatin')
  const requiresRodado = normalizedInsuranceType.includes('bicicleta')
  const isCelularInsurance = normalizedInsuranceType.includes('celular')
  const isMotoInsurance = normalizedInsuranceType.includes('moto')
  const isAutoInsurance = normalizedInsuranceType.includes('auto')
  const isPersonInsurance = normalizedInsuranceType.includes('persona')
  const isSupportedInsuranceType =
    isEcomovilityInsurance ||
    isMotoInsurance ||
    isAutoInsurance ||
    isCelularInsurance ||
    isPersonInsurance
  const unsupportedInsuranceMessage = values.tipo_vehiculo
    ? `Hola! Quiero cotizar el seguro de ${values.tipo_vehiculo}.`
    : 'Hola! Quiero cotizar un seguro.'
  const unsupportedInsuranceWhatsAppUrl = `https://wa.me/${AVELLANEDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    unsupportedInsuranceMessage
  )}`

  const marcaPlaceholder = isCelularInsurance
    ? 'Ej: Samsung'
    : isEcomovilityInsurance
      ? requiresRodado
        ? 'Ej: Raleigh'
        : 'Ej: Xiaomi'
      : isMotoInsurance
        ? 'Ej: Honda'
        : 'Ej: Fiat'

  const modeloPlaceholder = isCelularInsurance
    ? 'Ej: Galaxy S23'
    : isEcomovilityInsurance
      ? requiresRodado
        ? 'Ej: Mojave 2.0'
        : 'Ej: Electric Scooter 4'
      : isMotoInsurance
        ? 'Ej: Wave 110'
        : 'Ej: Cronos'

  const hasSharedRequiredValues =
    values.tipo_vehiculo && values.telefono.trim() && values.codigo_postal.trim() && values.consentimiento

  const hasAssetDetailsRequiredValues =
    isPersonInsurance || (values.marca.trim() && values.modelo.trim() && values.localidad.trim())

  const hasCoverageRequiredValues =
    isEcomovilityInsurance || isPersonInsurance || Boolean(values.cobertura_deseada)

  const hasEcomovilityRequiredValues =
    values.valor_ars.trim() && values.fecha_compra.trim() && (!requiresRodado || values.rodado.trim())

  const hasCelularRequiredValues = values.anio.trim()

  const hasVehicleRequiredValues = values.es_cero_km && values.anio.trim() && values.uso

  const hasPersonRequiredValues =
    values.cantidad_personas.trim() &&
    values.tipo_trabajo.trim() &&
    values.tiempo_uso_seguro.trim() &&
    values.clausula_no_repeticion

  const hasRequiredValues =
    hasSharedRequiredValues &&
    (isPersonInsurance
      ? hasPersonRequiredValues
      : hasAssetDetailsRequiredValues &&
        hasCoverageRequiredValues &&
        (isEcomovilityInsurance
          ? hasEcomovilityRequiredValues
          : isCelularInsurance
            ? hasCelularRequiredValues
            : hasVehicleRequiredValues))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasRequiredValues) {
      setError('Completa todos los campos obligatorios para continuar.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const detalleSeguro = isPersonInsurance
        ? [
            `Cantidad de personas a asegurar: ${values.cantidad_personas.trim()}`,
            `Tipo de trabajo: ${values.tipo_trabajo.trim()}`,
            `Tiempo de uso del seguro: ${values.tiempo_uso_seguro.trim()}`,
            `Clausulas de no repeticion: ${values.clausula_no_repeticion === 'si' ? 'Si' : 'No'}`
          ]
        : isEcomovilityInsurance
          ? [
              `Valor en ARS: ${values.valor_ars.trim()}`,
              requiresRodado ? `Rodado: ${values.rodado.trim()}` : '',
              `Fecha de compra: ${values.fecha_compra.trim()}`
            ]
          : isCelularInsurance
            ? []
            : [
                `Es 0KM: ${values.es_cero_km === 'si' ? 'Si' : 'No'}`,
                values.patente.trim() ? `Patente: ${values.patente.trim()}` : ''
              ]

      const mensajeConDetalle = [...detalleSeguro, values.mensaje.trim()].filter(Boolean).join('\n')

      const payload = {
        tipo_formulario: 'cotizacion' as const,
        tipo_vehiculo: values.tipo_vehiculo,
        nombre: values.nombre.trim(),
        telefono: values.telefono.trim(),
        email: values.email.trim() || undefined,
        marca_modelo: isPersonInsurance
          ? undefined
          : `${values.marca.trim()} ${values.modelo.trim()}`.trim() || undefined,
        anio: isPersonInsurance ? undefined : values.anio.trim() || undefined,
        localidad: isPersonInsurance ? undefined : values.localidad.trim() || undefined,
        codigo_postal: values.codigo_postal.trim(),
        uso: isEcomovilityInsurance || isCelularInsurance || isPersonInsurance ? undefined : values.uso,
        cobertura_deseada:
          isEcomovilityInsurance || isPersonInsurance ? undefined : values.cobertura_deseada,
        mensaje: mensajeConDetalle || undefined,
        consentimiento: values.consentimiento,
        source_page: sourcePage
      }

      await insertLead(payload)

      setSubmitted(true)
      setValues(buildInitialValues(insuranceType))
    } catch {
      setError('No pudimos enviar tu solicitud. Proba de nuevo en unos minutos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <h3 className="mb-2 text-2xl font-bold text-slate-900">Envio exitoso</h3>
        <p className="mb-3 text-slate-600">
          Recibimos tu solicitud. Te contactamos a la brevedad por WhatsApp o telefono.
        </p>
        <p className="text-sm text-slate-500">Respondemos en el dia habil.</p>
        <SimulatedSuccessBadge />
      </div>
    )
  }

  if (!isSupportedInsuranceType) {
    return (
      <a
        href={unsupportedInsuranceWhatsAppUrl}
        target="_blank"
        rel="noreferrer"
        className="btn-primary block w-full py-4 text-center text-lg"
      >
        Contactanos por whatsapp para cotizar este seguro
      </a>
    )
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo de seguro</p>
        <p className="text-sm font-semibold text-slate-900">{values.tipo_vehiculo || 'Sin seleccionar'}</p>
      </div>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Datos personales</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nombre y apellido (opcional)
          <input
            className="input-base"
            name="nombre"
            placeholder="Tu nombre completo"
            value={values.nombre}
            onChange={(event) => updateField('nombre', event.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Telefono / WhatsApp *
          <input
            className="input-base"
            name="telefono"
            placeholder="11 1234-5678"
            value={values.telefono}
            onChange={(event) => updateField('telefono', event.target.value)}
          />
        </label>
      </div>

      <label className="text-sm font-medium text-slate-700">
        Email (opcional)
        <input
          type="email"
          className="input-base"
          name="email"
          placeholder="tu@email.com"
          value={values.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
      </label>

      {isPersonInsurance ? (
        <label className="text-sm font-medium text-slate-700">
          Codigo postal *
          <input
            className="input-base"
            name="codigo_postal"
            placeholder="Ej: 1870"
            value={values.codigo_postal}
            onChange={(event) => updateField('codigo_postal', event.target.value)}
          />
        </label>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Localidad *
            <input
              className="input-base"
              name="localidad"
              placeholder="Tu localidad"
              value={values.localidad}
              onChange={(event) => updateField('localidad', event.target.value)}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Codigo postal *
            <input
              className="input-base"
              name="codigo_postal"
              placeholder="Ej: 1870"
              value={values.codigo_postal}
              onChange={(event) => updateField('codigo_postal', event.target.value)}
            />
          </label>
        </div>
      )}

      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {isPersonInsurance ? 'Datos de las personas a asegurar' : 'Datos de lo que vas a asegurar'}
      </h3>

      {isPersonInsurance ? (
        <>
          <label className="text-sm font-medium text-slate-700">
            ¿Cuantas personas se van a asegurar? *
            <input
              className="input-base"
              name="cantidad_personas"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej: 3"
              value={values.cantidad_personas}
              onChange={(event) =>
                updateField('cantidad_personas', event.target.value.replace(/\D/g, ''))
              }
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            ¿Que tipo de trabajo realizas? *
            <input
              className="input-base"
              name="tipo_trabajo"
              placeholder="Ej: Tecnico de mantenimiento"
              value={values.tipo_trabajo}
              onChange={(event) => updateField('tipo_trabajo', event.target.value)}
            />
          </label>

          <label className="text-sm font-medium text-slate-700">
            ¿Cuanto tiempo vas a utilizar el seguro? *
            <input
              className="input-base"
              name="tiempo_uso_seguro"
              placeholder="Ej: 12 meses"
              value={values.tiempo_uso_seguro}
              onChange={(event) => updateField('tiempo_uso_seguro', event.target.value)}
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">¿Te solicitan clausulas de no repeticion? *</p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  values.clausula_no_repeticion === 'si'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white'
                }`}
                onClick={() => updateField('clausula_no_repeticion', 'si')}
                aria-pressed={values.clausula_no_repeticion === 'si'}
              >
                Si
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  values.clausula_no_repeticion === 'no'
                    ? 'bg-brand-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-white'
                }`}
                onClick={() => updateField('clausula_no_repeticion', 'no')}
                aria-pressed={values.clausula_no_repeticion === 'no'}
              >
                No
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Marca *
              <input
                className="input-base"
                name="marca"
                placeholder={marcaPlaceholder}
                value={values.marca}
                onChange={(event) => updateField('marca', event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Modelo *
              <input
                className="input-base"
                name="modelo"
                placeholder={modeloPlaceholder}
                value={values.modelo}
                onChange={(event) => updateField('modelo', event.target.value)}
              />
            </label>
          </div>

          {isEcomovilityInsurance ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Valor en ARS *
                <input
                  className="input-base"
                  name="valor_ars"
                  inputMode="numeric"
                  placeholder="Ej: 1500000"
                  value={values.valor_ars}
                  onChange={(event) => updateField('valor_ars', event.target.value)}
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Fecha de compra *
                <input
                  type="date"
                  className="input-base"
                  name="fecha_compra"
                  value={values.fecha_compra}
                  onChange={(event) => updateField('fecha_compra', event.target.value)}
                />
              </label>

              {requiresRodado && (
                <label className="text-sm font-medium text-slate-700">
                  Rodado *
                  <input
                    className="input-base"
                    name="rodado"
                    placeholder="Ej: 29"
                    value={values.rodado}
                    onChange={(event) => updateField('rodado', event.target.value)}
                  />
                </label>
              )}
            </div>
          ) : isCelularInsurance ? (
            <label className="text-sm font-medium text-slate-700">
              Año de fabricacion *
              <input
                className="input-base"
                name="anio"
                placeholder="Ej: 2023"
                value={values.anio}
                onChange={(event) => updateField('anio', event.target.value)}
              />
            </label>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Año *
                  <input
                    className="input-base"
                    name="anio"
                    placeholder="Ej: 2022"
                    value={values.anio}
                    onChange={(event) => updateField('anio', event.target.value)}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Uso *
                  <select
                    className="input-base"
                    value={values.uso}
                    onChange={(event) => updateField('uso', event.target.value)}
                  >
                    <option value="">Seleccioná</option>
                    <option value="particular">Particular</option>
                    <option value="trabajo">Trabajo / Comercial</option>
                  </select>
                </label>
              </div>

              <label className="text-sm font-medium text-slate-700">
                Patente (opcional)
                <input
                  className="input-base"
                  name="patente"
                  placeholder="Ej: AA123BB"
                  value={values.patente}
                  onChange={(event) => updateField('patente', event.target.value)}
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">¿Es 0KM? *</p>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      values.es_cero_km === 'si'
                        ? 'bg-brand-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                    onClick={() => updateField('es_cero_km', 'si')}
                    aria-pressed={values.es_cero_km === 'si'}
                  >
                    Si
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      values.es_cero_km === 'no'
                        ? 'bg-brand-900 text-white shadow-sm'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                    onClick={() => updateField('es_cero_km', 'no')}
                    aria-pressed={values.es_cero_km === 'no'}
                  >
                    No
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {!isEcomovilityInsurance && !isPersonInsurance && (
        <label className="text-sm font-medium text-slate-700">
          Cobertura deseada *
          <select
            className="input-base"
            value={values.cobertura_deseada}
            onChange={(event) => updateField('cobertura_deseada', event.target.value)}
          >
            <option value="">Seleccioná una opción</option>
            {isMotoInsurance ? (
              <>
                <option value="responsabilidad_civil">Responsabilidad civil</option>
                <option value="cobertura_clasica">Cobertura CLÁSICA</option>
                <option value="cobertura_premium">Cobertura PREMIUM</option>
              </>
            ) : (
              <>
                <option value="cotizar_todas_companias">Cotizar en todas las compañias</option>
                <option value="responsabilidad_civil">Responsabilidad civil</option>
                {isAutoInsurance && (
                  <option value="cobertura_basica_robo">Cobertura basica por robo</option>
                )}
                <option value="terceros_completo">Terceros Completo</option>
                <option value="todo_riesgo">Todo Riesgo</option>
              </>
            )}
          </select>
        </label>
      )}

      <label className="text-sm font-medium text-slate-700">
        Comentarios adicionales (opcional)
        <textarea
          className="input-base min-h-24"
          placeholder="¿Algo más que quieras contarnos?"
          value={values.mensaje}
          onChange={(event) => updateField('mensaje', event.target.value)}
        />
      </label>

      <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <input
          className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-900"
          type="checkbox"
          checked={values.consentimiento}
          onChange={(event) => updateField('consentimiento', event.target.checked)}
        />
        Acepto que me contacten por WhatsApp o llamada para recibir la cotización. *
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...
          </>
        ) : (
          'Solicitar Cotización'
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        La cotización es orientativa y sin compromiso. Depende de evaluación y condiciones de la aseguradora.
      </p>
    </form>
  )
}
