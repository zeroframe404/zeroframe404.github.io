import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { insertLead } from '../../lib/leads'
import SimulatedSuccessBadge from './SimulatedSuccessBadge'

interface ContactoFormValues {
  nombre: string
  telefono: string
  motivo_contacto: string
  mensaje: string
}

const initialValues: ContactoFormValues = {
  nombre: '',
  telefono: '',
  motivo_contacto: '',
  mensaje: ''
}

interface ContactoFormProps {
  sourcePage?: string
}

export default function ContactoForm({ sourcePage = 'Contacto' }: ContactoFormProps) {
  const [values, setValues] = useState<ContactoFormValues>(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = <T extends keyof ContactoFormValues>(
    field: T,
    value: ContactoFormValues[T]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!values.nombre.trim() || !values.telefono.trim()) {
      setError('Completá nombre y WhatsApp para poder enviarlo.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const payload = {
      tipo_formulario: 'contacto' as const,
      nombre: values.nombre.trim(),
      telefono: values.telefono.trim(),
      motivo_contacto: values.motivo_contacto,
      mensaje: values.mensaje.trim() || undefined,
      consentimiento: true,
      source_page: sourcePage
    }

    try {
      await insertLead(payload)
      setSubmitted(true)
      setValues(initialValues)
    } catch {
      setError('No pudimos enviar tu mensaje. Probá nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="py-8 text-center">
        <h3 className="mb-2 text-xl font-bold text-slate-900">Envio exitoso</h3>
        <p className="text-slate-600">Te respondemos a la brevedad.</p>
        <SimulatedSuccessBadge />
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-700">
        Nombre *
        <input
          className="input-base"
          value={values.nombre}
          onChange={(event) => updateField('nombre', event.target.value)}
          placeholder="Tu nombre"
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        WhatsApp *
        <input
          className="input-base"
          value={values.telefono}
          onChange={(event) => updateField('telefono', event.target.value)}
          placeholder="11 1234-5678"
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Motivo
        <select
          className="input-base"
          value={values.motivo_contacto}
          onChange={(event) => updateField('motivo_contacto', event.target.value)}
        >
          <option value="">Seleccioná un motivo</option>
          <option value="cotizacion">Cotización</option>
          <option value="siniestro">Siniestro</option>
          <option value="modificacion">Modificar mi póliza</option>
          <option value="pago">Consulta de pago</option>
          <option value="otro">Otro</option>
        </select>
      </label>

      <label className="text-sm font-medium text-slate-700">
        Mensaje
        <textarea
          className="input-base min-h-28"
          value={values.mensaje}
          onChange={(event) => updateField('mensaje', event.target.value)}
          placeholder="¿En qué podemos ayudarte?"
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
          </>
        ) : (
          'Enviar mensaje'
        )}
      </button>
    </form>
  )
}
