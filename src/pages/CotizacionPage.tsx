import { ArrowRight, Handshake, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import CotizacionForm from '../components/forms/CotizacionForm'
import { WHATSAPP_COTIZACION_MESSAGE, buildWhatsAppUrl } from '../config/site'

const highlights = [
  { label: 'Respondemos en el día', icon: Handshake },
  { label: 'Sin compromiso', icon: ShieldCheck },
  { label: 'Asesoramiento personalizado', icon: MessageCircle }
]

type ProductItem = {
  title: string
  description: string
  image: string
  iconPath: string
}

type ProductCategory = {
  category: string
  items: ProductItem[]
}

const productCategories: ProductCategory[] = [
  {
    category: 'Vehículos',
    items: [
      {
        title: 'Autos',
        description: 'Coberturas para uso particular o comercial con asistencia y respaldo profesional.',
        image: '/seguros_tipo_imagen/Auto-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Auto-svg.svg'
      },
      {
        title: 'Motos',
        description: 'Opciones flexibles para distintas cilindradas, con protección y respuesta rápida.',
        image: '/seguros_tipo_imagen/Moto-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Moto-svg.svg'
      },
      {
        title: 'Monopatines',
        description: 'Protección para movilidad urbana con coberturas adaptadas al uso diario.',
        image: '/seguros_tipo_imagen/Monopatin_Electrico-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Monopatin-svg.svg'
      },
      {
        title: 'Bicicleta',
        description: 'Coberturas para bicicletas eléctricas y no eléctricas en uso diario o recreativo.',
        image: '/seguros_tipo_imagen/Bicicleta-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Bicicleta-svg.svg'
      },
      {
        title: 'Embarcaciones',
        description: 'Seguros para embarcaciones con respaldo y opciones según tipo de uso.',
        image: '/seguros_tipo_imagen/Embarcacion-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Emabarcacion-svg.svg'
      }
    ]
  },
  {
    category: 'Accidentes personales',
    items: [
      {
        title: 'Personas',
        description: 'Coberturas personales para proteger tu bienestar y el de tu familia.',
        image: '/seguros_tipo_imagen/Personal-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Personal-svg.svg'
      },
      {
        title: 'Notebook',
        description: 'Cobertura para equipos portátiles, ideal para estudio, trabajo o uso profesional.',
        image: '/seguros_tipo_imagen/Notebook-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Notebook-svg.svg'
      },
      {
        title: 'Celulares',
        description: 'Protegé tu celular ante daños accidentales, robos y otros riesgos.',
        image: '/seguros_tipo_imagen/Celular-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Celular-svg.svg'
      },
      {
        title: 'Vivienda',
        description: 'Protección para tu hogar frente a imprevistos, daños y robos.',
        image: '/seguros_tipo_imagen/Casa-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Casa-svg.svg'
      }
    ]
  },
  {
    category: 'Comerciales',
    items: [
      {
        title: 'Consorcio',
        description: 'Soluciones para edificios y administración de consorcios con atención especializada.',
        image: '/seguros_tipo_imagen/Consorcio-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Consorcio-svg.svg'
      },
      {
        title: 'Comercio',
        description: 'Coberturas para locales y negocios con foco en continuidad operativa.',
        image: '/seguros_tipo_imagen/Comercio-Imagen.webp',
        iconPath: '/seguros_tipo_svg/Comercio-svg.svg'
      }
    ]
  }
]

export default function CotizacionPage() {
  const whatsappUrl = buildWhatsAppUrl(WHATSAPP_COTIZACION_MESSAGE)
  const [selectedInsuranceType, setSelectedInsuranceType] = useState<string | null>(null)
  const catalogRef = useRef<HTMLElement | null>(null)
  const formRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!selectedInsuranceType) return
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedInsuranceType])

  const handleSelectInsurance = (title: string) => {
    setSelectedInsuranceType((current) => {
      if (current === title) {
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
      }
      return title
    })
  }

  const handleResetInsurance = () => {
    setSelectedInsuranceType(null)
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-16 lg:py-24">
        <div className="section-shell text-center">
          <h1 className="mb-4 text-3xl font-bold text-white lg:text-4xl">Pedí tu cotización</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Elegí el tipo de seguro y completá el formulario. Te contactamos con las mejores opciones según lo que necesitás.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-center gap-2 text-slate-300">
                  <Icon className="h-5 w-5 text-sky-400" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section ref={catalogRef} className="bg-white py-20 lg:py-28">
        <div className="section-shell">
          <div className="mb-16 text-center">
            <p className="section-subtitle">Nuestros productos</p>
            <h2 className="section-title mt-3 mb-4">¿Qué querés asegurar?</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Elegí por categoría y te armamos la mejor propuesta según lo que necesitás.
            </p>
          </div>

          <div className="space-y-14">
            {productCategories.map((group) => (
              <div key={group.category}>
                <div className="mb-6 flex items-center gap-3">
                  <h3 className="text-2xl font-bold text-slate-900">{group.category}</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {group.items.length} opciones
                  </span>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
                  {group.items.map((item) => {
                    const isSelected = selectedInsuranceType === item.title

                    return (
                      <article
                        key={item.title}
                        className={`overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-2xl ${
                          isSelected ? 'border-brand-200 ring-2 ring-brand-900/20' : 'border-slate-100'
                        }`}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          <div className="absolute left-4 top-4 rounded-xl bg-white/90 p-2 shadow-md">
                            <img
                              src={item.iconPath}
                              alt=""
                              aria-hidden="true"
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                        </div>
                        <div className="p-6 lg:p-8">
                          <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                          <p className="mb-6 text-sm text-slate-600">{item.description}</p>
                          <button
                            type="button"
                            onClick={() => handleSelectInsurance(item.title)}
                            className="btn-primary w-full"
                          >
                            {isSelected ? 'Seleccionado' : 'Elegir y continuar'} <ArrowRight className="ml-2 h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={formRef} className="bg-slate-50 py-16 lg:py-20">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
          {selectedInsuranceType ? (
            <>
              <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Seguro elegido</p>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedInsuranceType}</h2>
                </div>
                <button type="button" className="btn-outline px-6 py-3" onClick={handleResetInsurance}>
                  Elegir otro
                </button>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8 lg:p-10">
                <CotizacionForm key={selectedInsuranceType} sourcePage="Cotizacion" insuranceType={selectedInsuranceType} />
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Elegí un tipo de seguro para continuar</h2>
              <p className="mt-2 text-slate-600">
                Seleccioná una opción en el catálogo de arriba y se habilita el formulario.
              </p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="mb-3 text-slate-600">¿Preferís chatear directamente?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[#25D366] transition hover:text-[#20BA5C]"
            >
              <MessageCircle className="h-5 w-5" /> Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}