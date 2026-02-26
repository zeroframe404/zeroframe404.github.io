import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import SimulatedSuccessBadge from './SimulatedSuccessBadge'
import { submitSiniestroReport } from '../../lib/siniestros'

type BinaryAnswer = 'si' | 'no' | ''

type RoturaFormValues = {
  relato: string
  fechaUltimoSinDanio: string
  horaUltimoSinDanio: string
  fechaDeteccion: string
  horaDeteccion: string
  ubicacion: string
  titularConductor: BinaryAnswer
  conductorTitularDetalle: string
  vinculoConTitular: string
  danosVehiculo: string
}

const initialValues: RoturaFormValues = {
  relato: '',
  fechaUltimoSinDanio: '',
  horaUltimoSinDanio: '',
  fechaDeteccion: '',
  horaDeteccion: '',
  ubicacion: '',
  titularConductor: '',
  conductorTitularDetalle: '',
  vinculoConTitular: '',
  danosVehiculo: ''
}

type RoturaReportFormProps = {
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

export default function RoturaReportForm({ sourcePage = 'Siniestros' }: RoturaReportFormProps) {
  const [values, setValues] = useState<RoturaFormValues>(initialValues)
  const [croquisFile, setCroquisFile] = useState<File | null>(null)
  const [damageFiles, setDamageFiles] = useState<File[]>([])
  const [dniFrontFile, setDniFrontFile] = useState<File | null>(null)
  const [dniBackFile, setDniBackFile] = useState<File | null>(null)
  const [cedulaFrontFile, setCedulaFrontFile] = useState<File | null>(null)
  const [cedulaBackFile, setCedulaBackFile] = useState<File | null>(null)
  const [registroConductorFrontFile, setRegistroConductorFrontFile] = useState<File | null>(null)
  const [registroConductorBackFile, setRegistroConductorBackFile] = useState<File | null>(null)
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

  const updateField = <T extends keyof RoturaFormValues>(field: T, value: RoturaFormValues[T]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setValues(initialValues)
    setCroquisFile(null)
    setDamageFiles([])
    setDniFrontFile(null)
    setDniBackFile(null)
    setCedulaFrontFile(null)
    setCedulaBackFile(null)
    setRegistroConductorFrontFile(null)
    setRegistroConductorBackFile(null)
  }

  const validateForm = () => {
    if (
      !values.relato.trim() ||
      !values.fechaUltimoSinDanio ||
      !values.horaUltimoSinDanio ||
      !values.fechaDeteccion ||
      !values.horaDeteccion ||
      !values.ubicacion.trim() ||
      !values.danosVehiculo.trim()
    ) {
      return 'Completa todos los campos obligatorios de la declaracion de rotura.'
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

    if (croquisFile && !isAllowedImage(croquisFile)) {
      return 'El croquis debe ser PNG o JPG.'
    }

    if (damageFiles.length === 0) {
      return 'Subi al menos una foto/PDF de danos del vehiculo.'
    }

    if (damageFiles.length > 6) {
      return 'Podes subir hasta 6 archivos de danos del vehiculo.'
    }

    if (!damageFiles.every(isAllowedDocument)) {
      return 'Las fotos de danos deben ser PNG, JPG o PDF.'
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

    return null
  }

  const buildMessage = (reportId: string) => {
    const lines = [
      'Tipo de siniestro: Rotura',
      `Reporte ID: ${reportId}`,
      `1) Relato paso a paso: ${values.relato.trim()}`,
      `2) Croquis adjunto: ${croquisFile ? 'Si' : 'No'}`,
      `3) Fecha/hora ultima vez sin danos: ${formatDateForDisplay(values.fechaUltimoSinDanio)} ${values.horaUltimoSinDanio}`,
      `4) Fecha/hora deteccion faltante/rotura: ${formatDateForDisplay(values.fechaDeteccion)} ${values.horaDeteccion}`,
      `5) Ubicacion: ${values.ubicacion.trim()}`,
      `6) Titular y conductor: ${
        values.titularConductor === 'si'
          ? 'Si'
          : `No (Conductor/Titular: ${values.conductorTitularDetalle.trim()} | Vinculo: ${values.vinculoConTitular.trim()})`
      }`,
      `7) Danos del vehiculo: ${values.danosVehiculo.trim()}`
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

    const reportId = `rotura-${Date.now()}`

    const fileGroups: UploadLabelAndFiles[] = [
      ...(croquisFile ? [{ label: 'Croquis', files: [croquisFile] }] : []),
      { label: 'Danos del vehiculo', files: damageFiles },
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
      }
    ].filter((group) => group.files.length > 0)

    try {
      await submitSiniestroReport({
        tipo: 'rotura',
        sourcePage,
        nombreReporte: 'Reporte de siniestro - Rotura',
        telefono: 'No informado',
        detalleTexto: buildMessage(reportId),
        payloadJson: {
          reportId,
          ...values
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
        <h3 className="text-lg font-bold text-slate-900">Declaracion del siniestro - Rotura</h3>

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
            3. Fecha en que dejo su vehiculo sin daños por ultima vez *
            <input
              type="date"
              className="input-base"
              value={values.fechaUltimoSinDanio}
              onChange={(event) => updateField('fechaUltimoSinDanio', event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Hora en que lo dejo sin daños *
            <input
              type="time"
              className="input-base"
              value={values.horaUltimoSinDanio}
              onChange={(event) => updateField('horaUltimoSinDanio', event.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            4. Fecha cuando se dio cuenta del faltante/rotura *
            <input
              type="date"
              className="input-base"
              value={values.fechaDeteccion}
              onChange={(event) => updateField('fechaDeteccion', event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Hora cuando se dio cuenta del faltante/rotura *
            <input
              type="time"
              className="input-base"
              value={values.horaDeteccion}
              onChange={(event) => updateField('horaDeteccion', event.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          5. Calle, altura, entrecalles y localidad *
          <input
            className="input-base"
            value={values.ubicacion}
            onChange={(event) => updateField('ubicacion', event.target.value)}
            placeholder="Ej: Av Mitre 1234, entre Gral Paz y Sarmiento, Avellaneda"
          />
        </label>

        <BinaryToggle
          label="6. Sos titular del seguro y conductor del vehiculo al momento del siniestro? *"
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

        <label className="block text-sm font-medium text-slate-700">
          7. Menciona los daños que tiene tu vehiculo a causa del siniestro *
          <textarea
            className="input-base min-h-28"
            value={values.danosVehiculo}
            onChange={(event) => updateField('danosVehiculo', event.target.value)}
            placeholder="Detalle de danos visibles"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">Documentacion del vehiculo asegurado</h3>

        <label className="block text-sm font-medium text-slate-700">
          1. Fotos del vehiculo dañado (maximo 6, minimo 1, una debe mostrar patente) *
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            multiple
            className="input-base"
            onChange={(event) => {
              const selected = Array.from(event.target.files ?? [])
              setDamageFiles(selected.slice(0, 6))
            }}
          />
          <UploadList files={damageFiles} />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            2. DNI titular - Frente *
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
            3. Cedula del vehiculo - Frente *
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
            4. Registro de conducir del conductor - Frente *
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
          'Enviar reporte de rotura'
        )}
      </button>
    </form>
  )
}


