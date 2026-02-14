import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  MessageCircle,
  PhoneCall,
  ShieldAlert
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  WHATSAPP_SINIESTRO_MESSAGE,
  buildWhatsAppUrl
} from '../config/site'

const steps = [
  {
    number: '01',
    title: 'Asegurate de estar bien',
    description: 'Lo primero es tu seguridad y la de los ocupantes. Si hay heridos, llamá al 107 (SAME) o 911.',
    icon: ShieldAlert
  },
  {
    number: '02',
    title: 'Documentá el hecho',
    description: 'Sacá fotos del lugar, los vehículos involucrados, daños y patentes. Si hay testigos, pedí sus datos.',
    icon: ClipboardCheck
  },
  {
    number: '03',
    title: 'Contactanos',
    description: 'Escribinos por WhatsApp o llamanos. Te guiamos en todo el proceso de denuncia.',
    icon: PhoneCall
  },
  {
    number: '04',
    title: 'Completá la denuncia',
    description: 'Te ayudamos a completar el formulario de denuncia con todos los datos necesarios.',
    icon: CheckCircle2
  }
]

const requiredData = [
  'DNI del asegurado',
  'Carnet de conducir',
  'Cédula verde/azul del vehículo',
  'Número de póliza',
  'Fotos del siniestro',
  'Datos de terceros involucrados (si aplica)',
  'Denuncia policial (en caso de robo o accidente con lesiones)'
]

export default function SiniestrosPage() {
  const whatsappUrl = buildWhatsAppUrl(WHATSAPP_SINIESTRO_MESSAGE)

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-16 lg:py-24">
        <div className="section-shell text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Asistencia en siniestros
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white lg:text-4xl">¿Tuviste un siniestro?</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300">
            Mantené la calma. Te explicamos qué hacer paso a paso y te acompañamos en todo el proceso.
          </p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-whatsapp px-8 py-4 text-lg">
            <MessageCircle className="mr-2 h-5 w-5" /> Reportar siniestro por WhatsApp
          </a>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="section-shell">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-900 lg:text-3xl">¿Qué hacer en caso de siniestro?</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-slate-600">
            Seguí estos pasos para que el proceso sea más rápido y simple.
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <article key={step.number} className="rounded-2xl bg-slate-50 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-4xl font-bold text-slate-200">{step.number}</span>
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Icon className="h-5 w-5 text-brand-900" />
                    </div>
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-900">Datos que te vamos a pedir</h2>
          <p className="mb-8 text-center text-slate-600">Tené a mano esta información para agilizar la denuncia.</p>
          <div className="rounded-2xl bg-white p-8 shadow-soft">
            <ul className="grid gap-4 sm:grid-cols-2">
              {requiredData.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">Teléfonos de emergencia</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl bg-red-50 p-6 text-center">
              <p className="mb-1 text-3xl font-bold text-red-600">911</p>
              <p className="text-sm text-red-700">Emergencias</p>
            </article>
            <article className="rounded-xl bg-blue-50 p-6 text-center">
              <p className="mb-1 text-3xl font-bold text-blue-600">107</p>
              <p className="text-sm text-blue-700">SAME</p>
            </article>
            <article className="rounded-xl bg-amber-50 p-6 text-center">
              <p className="mb-1 text-3xl font-bold text-amber-600">100</p>
              <p className="text-sm text-amber-700">Bomberos</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-2 font-semibold text-slate-900">Información importante</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              La denuncia formal del siniestro se rige por las condiciones de tu póliza y los procedimientos de la aseguradora correspondiente. Los plazos para denunciar varían según cada compañía (generalmente 72 horas). Contactanos lo antes posible para no perder la cobertura.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-800 p-8 lg:p-12">
            <PhoneCall className="mx-auto mb-4 h-12 w-12 text-sky-300" />
            <h2 className="mb-4 text-2xl font-bold text-white">¿Necesitás ayuda ahora?</h2>
            <p className="mb-6 text-slate-300">
              Estamos disponibles de Lunes a Viernes de 9 a 18hs. Escribinos y te respondemos a la brevedad.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn bg-white font-semibold text-brand-900 hover:bg-slate-100">
                <MessageCircle className="mr-2 h-5 w-5" /> Hablar con un asesor
              </a>
              <Link to="/Cotizacion" className="btn-outline border-white/30 bg-white/10 text-white hover:bg-white/20">
                Pedir asesoramiento gratis <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
