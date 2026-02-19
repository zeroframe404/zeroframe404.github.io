import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  ArrowRight,
  Check,
  CircleGauge,
  Headset,
  MessageCircle,
  ShieldCheck,
  Star,
  Timer,
  Users,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  WHATSAPP_COTIZACION_MESSAGE,
  buildWhatsAppUrl
} from '../config/site'

const whyChoose = [
  {
    title: 'Cotizá rápido',
    description: 'En menos de 5 minutos tenés tu cotización lista. Sin trámites interminables.',
    icon: Timer,
    color: 'bg-amber-50 text-amber-600'
  },
  {
    title: 'Asesoramiento personalizado',
    description: 'Un asesor real te guía para elegir la mejor opción según tus necesidades.',
    icon: Users,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    title: 'Coberturas claras',
    description: 'Sin letra chica ni sorpresas. Te explicamos todo en palabras simples.',
    icon: ShieldCheck,
    color: 'bg-green-50 text-green-600'
  },
  {
    title: 'Atención por WhatsApp',
    description: 'Consultanos cuando quieras, respondemos al toque por el canal que más usás.',
    icon: MessageCircle,
    customIcon: '/wwasa.svg',
    color: 'bg-emerald-50 text-emerald-600'
  }
]

const processSteps = [
  {
    number: '01',
    title: 'Nos contas que seguro nesesitas',
    description: 'Completás un formulario rápido o nos escribís por WhatsApp con los datos del tipo de seguro que precisas'
  },
  {
    number: '02',
    title: 'Te pasamos opciones',
    description: 'Analizamos tu caso y te presentamos las mejores alternativas de cobertura y precio.'
  },
  {
    number: '03',
    title: 'Contratás y listo',
    description: 'Elegís la opción que más te convenga, firmás digitalmente y quedás cubierto al instante.'
  }
]

const coverageSummary = [
  {
    name: 'Responsabilidad Civil',
    description: 'Cobertura básica obligatoria. Cubre daños a terceros.'
  },
  {
    name: 'Terceros Completo',
    description: 'Incluye robo, incendio y daños parciales por granizo.'
  },
  {
    name: 'Todo Riesgo',
    description: 'Máxima protección. Cubre daños propios y de terceros.'
  },
  {
    name: 'Robo e Incendio',
    description: 'Protección ante robo total/parcial e incendio del vehículo.'
  },
  {
    name: 'Granizo',
    description: 'Cobertura para daños causados por fenómenos climáticos.'
  },
  {
    name: 'Asistencia 24hs',
    description: 'Auxilio mecánico, grúa y asistencia en viaje incluidos.'
  }
]

const testimonials = [
  {
    name: 'Martín G.',
    role: 'Propietario de auto',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    content: 'Excelente atención. Me respondieron al toque por WhatsApp y en menos de una hora tenía mi póliza lista. Muy recomendable.'
  },
  {
    name: 'Carolina S.',
    role: 'Propietaria de moto',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    content: 'Buscaba un seguro para mi moto y me dieron varias opciones claras. Sin letra chica, todo transparente. Muy conformes.'
  },
  {
    name: 'Roberto M.',
    role: 'Propietario de auto',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    content: 'Tuve un siniestro y me acompañaron en todo el proceso. La respuesta fue rápida y el trámite muy simple. Gracias!'
  }
]

const faqs = [
  {
    q: '¿Cuánto tarda en estar lista mi póliza?',
    a: 'Una vez que elegís tu cobertura y completás los datos, la póliza queda activa en el momento. Recibís toda la documentación por email y WhatsApp.'
  },
  {
    q: '¿Qué documentación necesito para cotizar?',
    a: 'Solo necesitamos los datos básicos de tu vehículo: marca, modelo, año, patente y uso. También tu DNI y datos de contacto.'
  },
  {
    q: '¿Puedo pagar en cuotas?',
    a: 'Sí, ofrecemos distintas opciones de pago: débito automático, tarjeta de crédito (en cuotas) o transferencia bancaria mensual.'
  },
  {
    q: '¿La cotización tiene algún costo?',
    a: 'No, cotizar es 100% gratis y sin compromiso. Te presentamos las opciones y vos decidís si querés avanzar.'
  },
  {
    q: '¿Atienden fuera de Dock Sud?',
    a: 'Sí, atendemos clientes de toda la zona sur del Gran Buenos Aires y alrededores. Consultanos por tu localidad.'
  }
]

const heroContentVariants: Variants = {
  hidden: { opacity: 0, x: -28 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.14
    }
  }
}

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' }
  }
}

const heroStatsVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

const heroStatItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const whatsappUrl = buildWhatsAppUrl(WHATSAPP_COTIZACION_MESSAGE)
  const siniestroWhatsAppUrl = 'https://wa.me/5491128486938'

  return (
    <div>
      <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-20 lg:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-sky-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"
          }}
        />

        <div className="hero-shell relative grid items-center gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-12">
          <motion.div
            initial="hidden"
            animate="show"
            variants={heroContentVariants}
            className="text-center lg:text-left"
          >
            <motion.span
              variants={heroItemVariants}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-sky-300"
            >
              <ShieldCheck className="h-4 w-4" /> Protección para tu vehículo
            </motion.span>
            <motion.h1
              variants={heroItemVariants}
              className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl"
            >
              Asegurá tu <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">Auto o Moto</span> en minutos
            </motion.h1>
            <motion.p
              variants={heroItemVariants}
              className="mx-auto mb-8 max-w-xl text-lg text-slate-300 lg:mx-0 lg:text-xl"
            >
              Cotización rápida, asesoramiento humano y cobertura a tu medida. Sin vueltas, sin letra chica.
            </motion.p>

            <motion.div variants={heroItemVariants} className="flex flex-col gap-4 sm:flex-row sm:flex-nowrap sm:justify-center lg:justify-start">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-whatsapp shrink-0 whitespace-nowrap px-5 py-3 text-sm md:text-base">
                <MessageCircle className="mr-2 h-5 w-5" /> Cotizar por WhatsApp
              </a>
              <Link to="/Cotizacion" className="btn-outline shrink-0 whitespace-nowrap border-white/30 bg-white/10 px-5 py-3 text-sm text-white hover:bg-white/20 md:text-base">
                <CircleGauge className="mr-2 h-5 w-5" /> Pedir Cotización
              </Link>
              <a
                href={siniestroWhatsAppUrl}
                target="_blank"
                rel="noreferrer"
                className="btn shrink-0 whitespace-nowrap border border-amber-200 bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-300 md:text-base"
              >
                <img
                  src="/SiniestroVector.svg"
                  alt=""
                  aria-hidden="true"
                  className="mr-2 h-5 w-5 object-contain"
                />
                Denunciar siniestro
              </a>
            </motion.div>

            <motion.div
              variants={heroStatsVariants}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 border-t border-white/10 pt-10 lg:justify-start"
            >
              <motion.div variants={heroStatItemVariants}>
                <p className="text-3xl font-bold text-white">+500</p>
                <p className="text-sm text-slate-400">Clientes protegidos</p>
              </motion.div>
              <div className="hidden h-12 w-px bg-white/20 sm:block" />
              <motion.div variants={heroStatItemVariants}>
                <p className="text-3xl font-bold text-white">24hs</p>
                <p className="text-sm text-slate-400">Respuesta garantizada</p>
              </motion.div>
              <div className="hidden h-12 w-px bg-white/20 sm:block" />
              <motion.div variants={heroStatItemVariants}>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-slate-400">Digital y humano</p>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-black/30">
              <div className="relative grid aspect-[4/5] grid-cols-2 bg-white">
                <div className="relative overflow-hidden">
                  <img
                    src="/ATMDockSud.png"
                    alt="Sucursal ATM Dock Sud"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
                    <p className="text-xs font-semibold tracking-wide text-white">Dock Sud</p>
                  </div>
                </div>

                <div className="relative overflow-hidden">
                  <img
                    src="/ATMLanus.png"
                    alt="Sucursal ATM Lanús"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
                    <p className="text-xs font-semibold tracking-wide text-white">Lanús</p>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/80" />
                <div className="pointer-events-none absolute inset-y-[-6%] left-1/2 w-8 -translate-x-1/2 bg-white/25 blur-md" />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-xl">
              <div className="rounded-lg bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Cobertura activa</p>
                <p className="text-xs text-slate-500">Tu vehículo protegido 24/7</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="section-shell">
          <div className="mb-16 text-center">
            <p className="section-subtitle">¿Por qué elegirnos?</p>
            <h2 className="section-title mt-3 mb-4">Seguros sin complicaciones</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Hacemos que asegurar tu vehículo sea simple, rápido y transparente.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {whyChoose.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="card group p-6 lg:p-8 transition hover:-translate-y-1 hover:shadow-xl">
                  <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${item.color}`}>
                    {item.customIcon ? (
                      <img
                        src={item.customIcon}
                        alt=""
                        aria-hidden="true"
                        className="h-7 w-7 object-contain"
                      />
                    ) : (
                      <Icon className="h-7 w-7" />
                    )}
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-20 lg:py-28">
        <div className="section-shell relative">
          <div className="mb-16 text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">Proceso simple</p>
            <h2 className="mt-3 mb-4 text-3xl font-bold text-white lg:text-4xl">¿Cómo funciona?</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-300">En tres pasos simples tenés tu seguro listo. Sin vueltas.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
            {processSteps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10">
                <p className="mb-4 text-5xl font-bold text-sky-400/40">{step.number}</p>
                <h3 className="mb-2 text-xl font-bold text-white">{step.title}</h3>
                <p className="text-slate-300">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="section-shell">
          <div className="mb-16 text-center">
            <p className="section-subtitle">Coberturas</p>
            <h2 className="section-title mt-3 mb-4">Protección completa</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">Conocé las coberturas disponibles y elegí la que mejor se adapte a tus necesidades.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coverageSummary.map((coverage) => (
              <article key={coverage.name} className="rounded-xl border border-slate-100 bg-white p-6 transition hover:border-sky-200 hover:shadow-lg">
                <h3 className="mb-1 font-bold text-slate-900">{coverage.name}</h3>
                <p className="text-sm text-slate-600">{coverage.description}</p>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-500">
            * Las coberturas y condiciones específicas dependen de cada aseguradora y póliza contratada. Consultanos para conocer los detalles de cada plan.
          </p>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="section-shell">
          <div className="mb-16 text-center">
            <p className="section-subtitle">Testimonios</p>
            <h2 className="section-title mt-3 mb-4">Lo que dicen nuestros clientes</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">La satisfacción de quienes nos eligen es nuestra mejor carta de presentación.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl bg-slate-50 p-8 transition hover:bg-slate-100">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={`${item.name}-${index}`} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mb-6 leading-relaxed text-slate-700">"{item.content}"</p>
                <div className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-sm text-slate-500">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 lg:py-28">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="section-subtitle">Preguntas frecuentes</p>
            <h2 className="section-title mt-3 mb-4">¿Tenés dudas?</h2>
            <p className="text-lg text-slate-600">Acá respondemos las consultas más comunes.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <article key={faq.q} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50"
                  >
                    <span className="pr-4 font-semibold text-slate-900">{faq.q}</span>
                    <ChevronDown className={`h-5 w-5 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <p className="px-5 pb-5 leading-relaxed text-slate-600">{faq.a}</p>}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 p-8 text-center lg:p-16">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-sky-400 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-blue-400 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">¿Listo para proteger tu vehículo?</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300">
                Escribinos ahora y en minutos tenés tu cotización. Sin compromiso, 100% gratis.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-whatsapp px-8 py-4 text-lg">
                  <MessageCircle className="mr-2 h-5 w-5" /> Chatear por WhatsApp
                </a>
                <Link to="/Cotizacion" className="btn-outline border-white/30 bg-white/10 px-8 py-4 text-lg text-white hover:bg-white/20">
                  Completar formulario <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              <p className="mt-8 text-sm text-slate-400">
                Respondemos en el dia • Atencion: Miercoles a Viernes 09:00 a 13:00 y 15:00 a
                19:00 • Sabado 09:00 a 14:00 (Lunes, Martes y Domingo cerrado)
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white pb-10 text-center text-sm text-slate-500">
        <div className="section-shell flex items-center justify-center gap-2">
          <Headset className="h-4 w-4" />
          Soporte humano real cuando más lo necesitás.
        </div>
      </section>
    </div>
  )
}
