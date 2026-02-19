import { Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { insertLead } from '../../lib/leads'
import { getSupabaseClient } from '../../lib/supabaseClient'
import SimulatedSuccessBadge from './SimulatedSuccessBadge'

type BinaryAnswer = 'si' | 'no' | ''

type SiniestroFormValues = {
  relato: string
  fecha: string
  hora: string
  ubicacion: string
  semaforos: BinaryAnswer
  semaforosDetalle: string
  titularConductor: BinaryAnswer
  conductorTitularDetalle: string
  vinculoConTitular: string
  huboLesiones: BinaryAnswer
  hospitalLesiones: string
  impactoDanos: string
}

const initialValues: SiniestroFormValues = {
  relato: '',
  fecha: '',
  hora: '',
  ubicacion: '',
  semaforos: '',
  semaforosDetalle: '',
  titularConductor: '',
  conductorTitularDetalle: '',
  vinculoConTitular: '',
  huboLesiones: '',
  hospitalLesiones: '',
  impactoDanos: ''
}

type SiniestroReportFormProps = {
  sourcePage?: string
}

const DOCUMENT_ACCEPT = '.png,.jpg,.jpeg,.pdf'
const IMAGE_ACCEPT = '.png,.jpg,.jpeg'
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf'])
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg'])
const SINIESTROS_BUCKET = import.meta.env.VITE_SUPABASE_SINIESTROS_BUCKET ?? 'siniestros'
const SIMULATED_SUBMIT = true
const SIMULATED_DELAY_MS = 700

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

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function sanitizePathSegment(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

export default function SiniestroReportForm({ sourcePage = 'Siniestros' }: SiniestroReportFormProps) {
  const [values, setValues] = useState<SiniestroFormValues>(initialValues)
  const [croquisFile, setCroquisFile] = useState<File | null>(null)
  const [damageFiles, setDamageFiles] = useState<File[]>([])
  const [dniFrontFile, setDniFrontFile] = useState<File | null>(null)
  const [dniBackFile, setDniBackFile] = useState<File | null>(null)
  const [cedulaFrontFile, setCedulaFrontFile] = useState<File | null>(null)
  const [cedulaBackFile, setCedulaBackFile] = useState<File | null>(null)
  const [registroConductorFile, setRegistroConductorFile] = useState<File | null>(null)
  const [registroTerceroFile, setRegistroTerceroFile] = useState<File | null>(null)
  const [polizaTerceroFile, setPolizaTerceroFile] = useState<File | null>(null)
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
          registroConductorFile &&
          registroTerceroFile &&
          polizaTerceroFile
      ),
    [
      dniFrontFile,
      dniBackFile,
      cedulaFrontFile,
      cedulaBackFile,
      registroConductorFile,
      registroTerceroFile,
      polizaTerceroFile
    ]
  )

  const updateField = <T extends keyof SiniestroFormValues>(field: T, value: SiniestroFormValues[T]) => {
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
    setRegistroConductorFile(null)
    setRegistroTerceroFile(null)
    setPolizaTerceroFile(null)
  }

  const validateForm = () => {
    if (
      !values.relato.trim() ||
      !values.fecha ||
      !values.hora ||
      !values.ubicacion.trim() ||
      !values.impactoDanos.trim()
    ) {
      return 'Completá todos los campos obligatorios de la declaración del siniestro.'
    }

    if (values.semaforos === '') {
      return 'Indicá si hubo participación de semáforos.'
    }

    if (values.semaforos === 'si' && !values.semaforosDetalle.trim()) {
      return 'Si hubo semáforos, detallá color y calle.'
    }

    if (values.titularConductor === '') {
      return 'Indicá si sos titular del seguro y conductor del vehículo.'
    }

    if (values.titularConductor === 'no' && (!values.conductorTitularDetalle.trim() || !values.vinculoConTitular.trim())) {
      return 'Completá conductor/titular y vínculo.'
    }

    if (values.huboLesiones === '') {
      return 'Indicá si hubo lesiones.'
    }

    if (values.huboLesiones === 'si' && !values.hospitalLesiones.trim()) {
      return 'Si hubo lesiones, indicá hospital y persona asistida.'
    }

    if (croquisFile && !isAllowedImage(croquisFile)) {
      return 'El croquis opcional debe ser PNG o JPG.'
    }

    if (damageFiles.length === 0) {
      return 'Subí al menos una foto/PDF de daños del vehículo.'
    }

    if (damageFiles.length > 6) {
      return 'Podés subir hasta 6 archivos para daños del vehículo.'
    }

    if (!damageFiles.every(isAllowedDocument)) {
      return 'Las fotos de daños deben ser PNG, JPG o PDF.'
    }

    if (!hasAllMandatorySingleFiles) {
      return 'Completá toda la documentación obligatoria del vehículo y del tercero.'
    }

    const singleFiles = [
      dniFrontFile,
      dniBackFile,
      cedulaFrontFile,
      cedulaBackFile,
      registroConductorFile,
      registroTerceroFile,
      polizaTerceroFile
    ].filter(Boolean) as File[]

    if (!singleFiles.every(isAllowedDocument)) {
      return 'Los archivos obligatorios deben ser PNG, JPG o PDF.'
    }

    return null
  }

  const uploadFiles = async (reportId: string, fileGroups: UploadLabelAndFiles[]) => {
    const supabase = getSupabaseClient()

    if (!supabase) {
      throw new Error(
        'Faltan variables de entorno de Supabase. Configurá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
      )
    }

    const uploaded: Array<{ label: string; path: string; publicUrl: string }> = []

    for (const group of fileGroups) {
      const groupSlug = sanitizePathSegment(group.label)

      for (const [index, file] of group.files.entries()) {
        const safeFileName = sanitizeFileName(file.name)
        const path = `${reportId}/${groupSlug}-${index + 1}-${Date.now()}-${safeFileName}`

        const { error: uploadError } = await supabase.storage
          .from(SINIESTROS_BUCKET)
          .upload(path, file, { upsert: false })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data } = supabase.storage.from(SINIESTROS_BUCKET).getPublicUrl(path)

        uploaded.push({
          label: group.label,
          path,
          publicUrl: data.publicUrl
        })
      }
    }

    return uploaded
  }

  const buildMessage = (
    reportId: string,
    uploadedFiles: Array<{ label: string; path: string; publicUrl: string }>
  ) => {
    const lines = [
      `Reporte ID: ${reportId}`,
      `1) Relato paso a paso: ${values.relato.trim()}`,
      `2) Fecha y hora: ${formatDateForDisplay(values.fecha)} ${values.hora}`,
      `3) Ubicacion: ${values.ubicacion.trim()}`,
      `4) Semaforos: ${values.semaforos === 'si' ? `Si (${values.semaforosDetalle.trim()})` : 'No'}`,
      `5) Titular y conductor: ${
        values.titularConductor === 'si'
          ? 'Si'
          : `No (Conductor/Titular: ${values.conductorTitularDetalle.trim()} | Vinculo: ${values.vinculoConTitular.trim()})`
      }`,
      `6) Lesiones: ${
        values.huboLesiones === 'si' ? `Si (${values.hospitalLesiones.trim()})` : 'No'
      }`,
      `7) Impacto y danos: ${values.impactoDanos.trim()}`,
      `Croquis adjunto: ${croquisFile ? 'Si' : 'No'}`
    ]

    if (uploadedFiles.length > 0) {
      lines.push('Archivos adjuntos:')
      uploadedFiles.forEach((item) => {
        lines.push(`- ${item.label}: ${item.publicUrl || item.path}`)
      })
    }

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

    const reportId = `siniestro-${Date.now()}`

    const fileGroups: UploadLabelAndFiles[] = [
      ...(croquisFile ? [{ label: 'Croquis', files: [croquisFile] }] : []),
      { label: 'Danos del vehiculo', files: damageFiles },
      { label: 'DNI titular frente', files: dniFrontFile ? [dniFrontFile] : [] },
      { label: 'DNI titular dorso', files: dniBackFile ? [dniBackFile] : [] },
      { label: 'Cedula frente', files: cedulaFrontFile ? [cedulaFrontFile] : [] },
      { label: 'Cedula dorso', files: cedulaBackFile ? [cedulaBackFile] : [] },
      { label: 'Registro conductor', files: registroConductorFile ? [registroConductorFile] : [] },
      { label: 'Registro tercero', files: registroTerceroFile ? [registroTerceroFile] : [] },
      { label: 'Poliza tercero', files: polizaTerceroFile ? [polizaTerceroFile] : [] }
    ].filter((group) => group.files.length > 0)

    try {
      if (SIMULATED_SUBMIT) {
        await new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS))

        const simulatedMessage = buildMessage(reportId, [])

        await insertLead({
          tipo_formulario: 'contacto',
          nombre: 'Reporte de siniestro',
          telefono: 'No informado',
          motivo_contacto: 'siniestro',
          mensaje: simulatedMessage,
          consentimiento: true,
          source_page: sourcePage
        }).catch(() => null)
      } else {
        const uploadedFiles = await uploadFiles(reportId, fileGroups)
        const message = buildMessage(reportId, uploadedFiles)

        await insertLead({
          tipo_formulario: 'contacto',
          nombre: 'Reporte de siniestro',
          telefono: 'No informado',
          motivo_contacto: 'siniestro',
          mensaje: message,
          consentimiento: true,
          source_page: sourcePage
        })
      }

      setSubmitted(true)
      resetForm()
    } catch {
      setError(
        'No pudimos enviar el reporte. Verificá la carga de archivos o escribinos por WhatsApp para asistencia inmediata.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="py-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-slate-900">Envio simulado exitoso</h3>
        <p className="text-slate-600">Recibimos tu siniestro y te contactamos a la brevedad.</p>
        <SimulatedSuccessBadge />
      </div>
    )
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Declaracion del siniestro</h3>

        <label className="block text-sm font-medium text-slate-700">
          1. Redacta como ocurrio el siniestro, paso a paso. *
          <textarea
            className="input-base min-h-32"
            value={values.relato}
            onChange={(event) => updateField('relato', event.target.value)}
            placeholder="Detalle cronológico del hecho"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Croquis del accidente (opcional, imagen)
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
            2. Fecha de ocurrencia (DD/MM/AA) *
            <input
              type="date"
              className="input-base"
              value={values.fecha}
              onChange={(event) => updateField('fecha', event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Horario puntual *
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
            placeholder="Ej: Av. Mitre 1234, entre Gral Paz y Sarmiento, Avellaneda"
          />
        </label>

        <BinaryToggle
          label="4. Hubo participación de semáforos? *"
          value={values.semaforos}
          onChange={(value) => {
            updateField('semaforos', value)
            if (value === 'no') updateField('semaforosDetalle', '')
          }}
        />

        {values.semaforos === 'si' && (
          <label className="block text-sm font-medium text-slate-700">
            Detallá calle y color del semáforo *
            <input
              className="input-base"
              value={values.semaforosDetalle}
              onChange={(event) => updateField('semaforosDetalle', event.target.value)}
              placeholder="Ej: Semáforo de Mitre y Sarmiento en rojo"
            />
          </label>
        )}

        <BinaryToggle
          label="5. Sos titular del seguro y conductor al momento del siniestro? *"
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
                placeholder="Ej: cónyuge, hijo, empleado"
              />
            </label>
          </div>
        )}

        <BinaryToggle
          label="6. Hubo lesiones? *"
          value={values.huboLesiones}
          onChange={(value) => {
            updateField('huboLesiones', value)
            if (value === 'no') updateField('hospitalLesiones', '')
          }}
        />

        {values.huboLesiones === 'si' && (
          <label className="block text-sm font-medium text-slate-700">
            Indicá quién tuvo lesiones y a qué hospital asistió *
            <input
              className="input-base"
              value={values.hospitalLesiones}
              onChange={(event) => updateField('hospitalLesiones', event.target.value)}
              placeholder="Ej: Juan Perez - Hospital Fiorito"
            />
          </label>
        )}

        <label className="block text-sm font-medium text-slate-700">
          7. Parte del impacto y daños del vehículo *
          <textarea
            className="input-base min-h-28"
            value={values.impactoDanos}
            onChange={(event) => updateField('impactoDanos', event.target.value)}
            placeholder="Ej: impacto lateral derecho, daños en puerta, guardabarros y óptica"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">Documentacion del vehiculo asegurado</h3>

        <label className="block text-sm font-medium text-slate-700">
          1. Fotos del vehículo asegurado (maximo 6, minimo 1, una debe mostrar patente) *
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
            DNI titular - Reverso *
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
            3. Cedula del vehículo - Frente *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setCedulaFrontFile(getSingleFile(event.target.files))}
            />
            <UploadList files={cedulaFrontFile ? [cedulaFrontFile] : []} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Cedula del vehículo - Reverso *
            <input
              type="file"
              accept={DOCUMENT_ACCEPT}
              className="input-base"
              onChange={(event) => setCedulaBackFile(getSingleFile(event.target.files))}
            />
            <UploadList files={cedulaBackFile ? [cedulaBackFile] : []} />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          4. Registro de conducir del conductor al momento del siniestro *
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            className="input-base"
            onChange={(event) => setRegistroConductorFile(getSingleFile(event.target.files))}
          />
          <UploadList files={registroConductorFile ? [registroConductorFile] : []} />
        </label>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">Documentacion del tercero</h3>

        <label className="block text-sm font-medium text-slate-700">
          1. Registro de conducir del tercero *
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            className="input-base"
            onChange={(event) => setRegistroTerceroFile(getSingleFile(event.target.files))}
          />
          <UploadList files={registroTerceroFile ? [registroTerceroFile] : []} />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          2. Poliza del seguro del tercero (aseguradora y numero de poliza) *
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            className="input-base"
            onChange={(event) => setPolizaTerceroFile(getSingleFile(event.target.files))}
          />
          <UploadList files={polizaTerceroFile ? [polizaTerceroFile] : []} />
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
          'Enviar reporte de siniestro'
        )}
      </button>
    </form>
  )
}
