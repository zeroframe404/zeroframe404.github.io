import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import SimulatedSuccessBadge from './SimulatedSuccessBadge'
import { submitSiniestroReport } from '../../lib/siniestros'

type BinaryAnswer = 'si' | 'no' | ''
type IncendioKind = 'total' | 'parcial' | ''

type IncendioFormValues = {
  relato: string
  fecha: string
  hora: string
  ubicacion: string
  titularConductor: BinaryAnswer
  conductorTitularDetalle: string
  vinculoConTitular: string
  tipoIncendio: IncendioKind
  detalleIncendioParcial: string
  comoSeApago: string
}

const initialValues: IncendioFormValues = {
  relato: '',
  fecha: '',
  hora: '',
  ubicacion: '',
  titularConductor: '',
  conductorTitularDetalle: '',
  vinculoConTitular: '',
  tipoIncendio: '',
  detalleIncendioParcial: '',
  comoSeApago: ''
}

type IncendioReportFormProps = {
  sourcePage?: string
}

const DOCUMENT_ACCEPT = '.png,.jpg,.jpeg,.pdf'
const IMAGE_ACCEPT = '.png,.jpg,.jpeg'
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf'])
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg'])

type UploadLabelAndFiles = {
  label: string
  files: File[]
}

function isAllowedByExtension(file: File, extensions: readonly string[]) {
  const lowerName = file.name.toLowerCase()
  return extensions.some((extension) => lowerName.endsWith(extension))
}

function isAllowedDocument(file: File) {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true
  return isAllowedByExtension(file, ['.png', '.jpg', '.jpeg', '.pdf'])
}

function isAllowedImage(file: File) {
  if (ALLOWED_IMAGE_MIME_TYPES.has(file.type)) return true
  return isAllowedByExtension(file, ['.png', '.jpg', '.jpeg'])
}

function formatDateForDisplay(dateValue: string) {
  const [year, month, day] = dateValue.split('-')
  if (!year || !month || !day) return dateValue
  return `${day}/${month}/${year.slice(-2)}`
}

function getSingleFile(fileList: FileList | null) {
  if (!fileList || fileList.length === 0) return null
  return fileList[0] ?? null
}

function UploadList({ files }: { files: File[] }) {
  if (files.length === 0) return null

  return (
    <ul className="mt-2 space-y-1 text-xs text-slate-500">
      {files.map((file) => (
        <li key={`${file.name}-${file.size}`}>{file.name}</li>
      ))}
    </ul>
  )
}

type BinaryToggleProps = {
  label: string
  value: BinaryAnswer
  onChange: (value: BinaryAnswer) => void
}

function BinaryToggle({ label, value, onChange }: BinaryToggleProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
      <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
        <button
          type="button"
          onClick={() => onChange('si')}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            value === 'si' ? 'bg-brand-900 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          Si
        </button>
        <button
          type="button"
          onClick={() => onChange('no')}
          className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
            value === 'no' ? 'bg-brand-900 text-white' : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          No
        </button>
      </div>
    </div>
  )
}

export default function IncendioReportForm({
  sourcePage = 'Siniestros'
}: IncendioReportFormProps) {
  const [values, setValues] = useState<IncendioFormValues>(initialValues)
  const [croquisFile, setCroquisFile] = useState<File | null>(null)
  const [dniFrontFile, setDniFrontFile] = useState<File | null>(null)
  const [dniBackFile, setDniBackFile] = useState<File | null>(null)
  const [cedulaFrontFile, setCedulaFrontFile] = useState<File | null>(null)
  const [cedulaBackFile, setCedulaBackFile] = useState<File | null>(null)
  const [registroConductorFrontFile, setRegistroConductorFrontFile] = useState<File | null>(null)
  const [registroConductorBackFile, setRegistroConductorBackFile] = useState<File | null>(null)
  const [actaBomberosFile, setActaBomberosFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAllMandatorySingleFiles = useMemo(
    () =>
      Boolean(
        dniFrontFile &&
          dniBackFile &&
          cedulaFrontFile &&
          cedulaBackFile &&
          registroConductorFrontFile &&
          registroConductorBackFile
      ),
    [
      dniFrontFile,
      dniBackFile,
      cedulaFrontFile,
      cedulaBackFile,
      registroConductorFrontFile,
      registroConductorBackFile
    ]
  )

  const updateField = <T extends keyof IncendioFormValues>(field: T, value: IncendioFormValues[T]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setValues(initialValues)
    setCroquisFile(null)
    setDniFrontFile(null)
    setDniBackFile(null)
    setCedulaFrontFile(null)
    setCedulaBackFile(null)
    setRegistroConductorFrontFile(null)
    setRegistroConductorBackFile(null)
    setActaBomberosFile(null)
  }

  const validateForm = () => {
    if (
      !values.relato.trim() ||
      !values.fecha ||
      !values.hora ||
      !values.ubicacion.trim() ||
      !values.comoSeApago.trim()
    ) {
      return 'Completa todos los campos obligatorios de la declaracion de incendio.'
    }

    if (values.titularConductor === '') {
      return 'Indica si sos titular del seguro y conductor del vehiculo.'
    }

    if (
      values.titularConductor === 'no' &&
      (!values.conductorTitularDetalle.trim() || !values.vinculoConTitular.trim())
    ) {
      return 'Completa conductor/titular y vinculo.'
    }

    if (values.tipoIncendio === '') {
      return 'Indica si el incendio fue total o parcial.'
    }

    if (values.tipoIncendio === 'parcial' && !values.detalleIncendioParcial.trim()) {
      return 'Si fue incendio parcial, agrega la observacion sobre la parte quemada.'
    }

    if (croquisFile && !isAllowedImage(croquisFile)) {
      return 'El croquis debe ser PNG o JPG.'
    }

    if (!hasAllMandatorySingleFiles) {
      return 'Completa toda la documentacion obligatoria del vehiculo.'
    }

    const singleFiles = [
      dniFrontFile,
      dniBackFile,
      cedulaFrontFile,
      cedulaBackFile,
      registroConductorFrontFile,
      registroConductorBackFile
    ].filter(Boolean) as File[]

    if (!singleFiles.every(isAllowedDocument)) {
      return 'Los archivos obligatorios deben ser PNG, JPG o PDF.'
    }

    if (actaBomberosFile && !isAllowedDocument(actaBomberosFile)) {
      return 'El acta de bomberos debe estar en PNG, JPG o PDF.'
    }

    return null
  }

  const buildMessage = (reportId: string) => {
    const lines = [
      'Tipo de siniestro: Incendio total/parcial',
      `Reporte ID: ${reportId}`,
      `1) Relato paso a paso: ${values.relato.trim()}`,
      `2) Fecha y hora: ${formatDateForDisplay(values.fecha)} ${values.hora}`,
      `3) Ubicacion: ${values.ubicacion.trim()}`,
      `4) Titular y conductor: ${
        values.titularConductor === 'si'
          ? 'Si'
          : `No (Conductor/Titular: ${values.conductorTitularDetalle.trim()} | Vinculo: ${values.vinculoConTitular.trim()})`
      }`,
      `5) Incendio: ${
        values.tipoIncendio === 'total'
          ? 'Total'
          : `Parcial (${values.detalleIncendioParcial.trim()})`
      }`,
      `6) Como se apago el incendio: ${values.comoSeApago.trim()}`,
      `Croquis adjunto: ${croquisFile ? 'Si' : 'No'}`,
      `Acta de bomberos adjunta: ${actaBomberosFile ? 'Si' : 'No'}`
    ]

    return lines.join('\n')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    const reportId = `incendio-${Date.now()}`

    const fileGroups: UploadLabelAndFiles[] = [
      ...(croquisFile ? [{ label: 'Croquis', files: [croquisFile] }] : []),
      { label: 'DNI titular frente', files: dniFrontFile ? [dniFrontFile] : [] },
      { label: 'DNI titular dorso', files: dniBackFile ? [dniBackFile] : [] },
      { label: 'Cedula frente', files: cedulaFrontFile ? [cedulaFrontFile] : [] },
      { label: 'Cedula dorso', files: cedulaBackFile ? [cedulaBackFile] : [] },
      {
        label: 'Registro conductor frente',
        files: registroConductorFrontFile ? [registroConductorFrontFile] : []
      },
      {
        label: 'Registro conductor dorso',
        files: registroConductorBackFile ? [registroConductorBackFile] : []
      },
      { label: 'Acta bomberos', files: actaBomberosFile ? [actaBomberosFile] : [] }
    ].filter((group) => group.files.length > 0)

    try {
      await submitSiniestroReport({
        tipo: 'incendio',
        sourcePage,
        nombreReporte: 'Reporte de siniestro - Incendio total/parcial',
        telefono: 'No informado',
        detalleTexto: buildMessage(reportId),
        payloadJson: {
          reportId,
          ...values,
          actaBomberosAdjunta: Boolean(actaBomberosFile)
        },
        fileGroups
      })

      setSubmitted(true)
      resetForm()
    } catch {
      setError(
        'No pudimos enviar el reporte. Verifica la carga de archivos o escribinos por WhatsApp para asistencia inmediata.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="py-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-slate-900">Envio exitoso</h3>
        <p className="text-slate-600">Recibimos tu siniestro y te contactamos a la brevedad.</p>
        <SimulatedSuccessBadge />
      </div>
    )
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Declaracion del siniestro - Incendio total/parcial
        </h3>

        <label className="block text-sm font-medium text-slate-700">
          1. Redacta como ocurrio el siniestro, paso a paso. *
          <textarea
            className="input-base min-h-32"
            value={values.relato}
            onChange={(event) => updateField('relato', event.target.value)}
            placeholder="Detalle cronologico del hecho"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Croquis (opcional, imagen)
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            className="input-base"
            onChange={(event) => setCroquisFile(getSingleFile(event.target.files))}
          />
          {croquisFile && <p className="mt-2 text-xs text-slate-500">{croquisFile.name}</p>}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            2. Fecha del siniestro *
            <input
              type="date"
              className="input-base"
              value={values.fecha}
              onChange={(event) => updateField('fecha', event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Hora del siniestro *
            <input
              type="time"
              className="input-base"
              value={values.hora}
              onChange={(event) => updateField('hora', event.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          3. Calle, altura, entrecalles y localidad *
          <input
            className="input-base"
            value={values.ubicacion}
            onChange={(event) => updateField('ubicacion', event.target.value)}
            placeholder="Ej: Av Mitre 1234, entre Gral Paz y Sarmiento, Avellaneda"
          />
        </label>

        <BinaryToggle
          label="4. Sos titular del seguro y conductor del vehiculo al momento del siniestro? *"
          value={values.titularConductor}
          onChange={(value) => {
            updateField('titularConductor', value)
            if (value === 'si') {
              updateField('conductorTitularDetalle', '')
              updateField('vinculoConTitular', '')
            }
          }}
        />

        {values.titularConductor === 'no' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Conductor/titular *
              <input
                className="input-base"
                value={values.conductorTitularDetalle}
                onChange={(event) => updateField('conductorTitularDetalle', event.target.value)}
                placeholder="Nombre y apellido"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Vinculo *
              <input
                className="input-base"
                value={values.vinculoConTitular}
                onChange={(event) => updateField('vinculoConTitular', event.target.value)}
                placeholder="Ej: conyuge, hijo, empleado"
              />
            </label>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">5. Incendio total/parcial *</p>
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => {
                updateField('tipoIncendio', 'total')
                updateField('detalleIncendioParcial', '')
              }}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                values.tipoIncendio === 'total'
                  ? 'bg-brand-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Total
            </button>
            <button
              type="button"
              onClick={() => updateField('tipoIncendio', 'parcial')}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                values.tipoIncendio === 'parcial'
                  ? 'bg-brand-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Parcial
            </button>
          </div>
        </div>

        {values.tipoIncendio === 'parcial' && (
          <label className="block text-sm font-medium text-slate-700">
            Observacion para mencionar la parte quemada *
            <textarea
              className="input-base min-h-24"
              value={values.detalleIncendioParcial}
              onChange={(event) => updateField('detalleIncendioParcial', event.target.value)}
              placeholder="Detalle de la parte quemada del vehiculo"
            />
          </label>
        )}

        <label className="block text-sm font-medium text-slate-700">
          6. Como se apago el incendio? *
          <textarea
            className="input-base min-h-24"
            value={values.comoSeApago}
            onChange={(event) => updateField('comoSeApago', event.target.value)}
            placeholder="Ej: Bomberos voluntarios, matafuegos, vecinos, etc."
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">Documentacion del vehiculo asegurado</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            1. DNI titular - Frente *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setDniFrontFile(getSingleFile(event.target.files))}
            />
            <UploadList files={dniFrontFile ? [dniFrontFile] : []} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            DNI titular - Dorso *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setDniBackFile(getSingleFile(event.target.files))}
            />
            <UploadList files={dniBackFile ? [dniBackFile] : []} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            2. Cedula del vehiculo - Frente *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setCedulaFrontFile(getSingleFile(event.target.files))}
            />
            <UploadList files={cedulaFrontFile ? [cedulaFrontFile] : []} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Cedula del vehiculo - Dorso *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setCedulaBackFile(getSingleFile(event.target.files))}
            />
            <UploadList files={cedulaBackFile ? [cedulaBackFile] : []} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            3. Registro de conducir del conductor - Frente *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setRegistroConductorFrontFile(getSingleFile(event.target.files))}
            />
            <UploadList files={registroConductorFrontFile ? [registroConductorFrontFile] : []} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Registro de conducir del conductor - Dorso *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setRegistroConductorBackFile(getSingleFile(event.target.files))}
            />
            <UploadList files={registroConductorBackFile ? [registroConductorBackFile] : []} />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          4. Acta de bomberos (opcional)
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            className="input-base"
            onChange={(event) => setActaBomberosFile(getSingleFile(event.target.files))}
          />
          <UploadList files={actaBomberosFile ? [actaBomberosFile] : []} />
        </label>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" className="btn-primary w-full py-3 text-base sm:text-lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando reporte...
          </>
        ) : (
          'Enviar reporte de incendio'
        )}
      </button>
    </form>
  )
}
