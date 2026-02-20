import { ArrowRight, ChevronDown, Handshake, MessageCircle, ShieldCheck } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import WhatsAppIcon from '../components/icons/WhatsAppIcon'
import { WHATSAPP_COTIZACION_MESSAGE } from '../config/site'

const CotizacionForm = lazy(() => import('../components/forms/CotizacionForm'))

const highlights = [
  { label: 'Respondemos en el dia', icon: Handshake },
  { label: 'Sin compromiso', icon: ShieldCheck },
  { label: 'Asesoramiento personalizado', icon: MessageCircle }
]

type ProductItem = {
  title: string
  description: string
  iconPath: string
}

type ProductCategory = {
  category: string
  items: ProductItem[]
}

const productCategories: ProductCategory[] = [
  {
    category: 'Vehiculos',
    items: [
      {
        title: 'Motos',
        description: 'Opciones flexibles para distintas cilindradas, con proteccion y respuesta rapida.',
        iconPath: '/seguros_tipo_svg/Moto-svg.svg'
      },
      {
        title: 'Autos',
        description: 'Coberturas para uso particular o comercial con asistencia y respaldo profesional.',
        iconPath: '/seguros_tipo_svg/Auto-svg.svg'
      }
    ]
  },
  {
    category: 'Ecomovilidad',
    items: [
      {
        title: 'Bicicleta',
        description: 'Coberturas para bicicletas de uso urbano, recreativo o de traslado diario.',
        iconPath: '/seguros_tipo_svg/Bicicleta-svg.svg'
      },
      {
        title: 'Bicicleta de competicion',
        description: 'Proteccion para bicicletas deportivas y de alto rendimiento.',
        iconPath: '/seguros_tipo_svg/Bicicleta-Deportiva-SVG.svg'
      },
      {
        title: 'Bicicleta electrica',
        description: 'Cobertura para e-bikes con movilidad sustentable en ciudad.',
        iconPath: '/seguros_tipo_svg/Bicicleta-electricasvg.svg'
      },
      {
        title: 'Monopatin electrico',
        description: 'Proteccion para movilidad urbana con coberturas adaptadas al uso diario.',
        iconPath: '/seguros_tipo_svg/Monopatin-svg.svg'
      }
    ]
  },
  {
    category: 'Accidentes personales',
    items: [
      {
        title: 'Personas',
        description: 'Coberturas personales para proteger tu bienestar y el de tu familia.',
        iconPath: '/seguros_tipo_svg/Personal-svg.svg'
      }
    ]
  },
  {
    category: 'Riesgos varios',
    items: [
      {
        title: 'Embarcaciones',
        description: 'Seguros para embarcaciones con respaldo y opciones segun tipo de uso.',
        iconPath: '/seguros_tipo_svg/Emabarcacion-svg.svg'
      },
      {
        title: 'Notebook',
        description: 'Cobertura para equipos portatiles, ideal para estudio, trabajo o uso profesional.',
        iconPath: '/seguros_tipo_svg/Notebook-svg.svg'
      },
      {
        title: 'Celulares',
        description: 'Protege tu celular ante danos accidentales, robos y otros riesgos.',
        iconPath: '/seguros_tipo_svg/Celular-svg.svg'
      },
      {
        title: 'Vivienda',
        description: 'Proteccion para tu hogar frente a imprevistos, danos y robos.',
        iconPath: '/seguros_tipo_svg/Casa-svg.svg'
      },
      {
        title: 'Consorcio',
        description: 'Soluciones para edificios y administracion de consorcios con atencion especializada.',
        iconPath: '/seguros_tipo_svg/Consorcio-svg.svg'
      },
      {
        title: 'Comercio',
        description: 'Coberturas para locales y negocios con foco en continuidad operativa.',
        iconPath: '/seguros_tipo_svg/Comercio-svg.svg'
      },
      {
        title: 'Herramientas',
        description: 'Coberturas para herramientas de trabajo, traslados y uso profesional.',
        iconPath: '/seguros_tipo_svg/Herramientas-svg.svg'
      },
      {
        title: 'Bolso protegido',
        description: 'Cobertura para objetos personales y pertenencias en via publica.',
        iconPath: '/seguros_tipo_svg/Bolso-svg.svg'
      }
    ]
  }
]

const CATEGORY_MENU_TRANSITION_MS = 260
const AVELLANEDA_WHATSAPP_NUMBER = '5491140830416'

export default function CotizacionPage() {
  const whatsappUrl = `https://wa.me/${AVELLANEDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_COTIZACION_MESSAGE)}`
  const initialCategory = productCategories[0]?.category ?? ''
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [visibleCategory, setVisibleCategory] = useState(initialCategory)
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(true)
  const [selectedInsuranceType, setSelectedInsuranceType] = useState<string | null>(null)
  const catalogRef = useRef<HTMLElement | null>(null)
  const formRef = useRef<HTMLElement | null>(null)
  const categoryMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeCategory = useMemo(
    () => productCategories.find((group) => group.category === visibleCategory) ?? productCategories[0],
    [visibleCategory]
  )

  useEffect(() => {
    if (!selectedInsuranceType) return
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedInsuranceType])

  useEffect(
    () => () => {
      if (categoryMenuTimeoutRef.current) {
        clearTimeout(categoryMenuTimeoutRef.current)
      }
    },
    []
  )

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

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) return

    setSelectedCategory(category)
    setIsCategoryMenuOpen(false)

    if (categoryMenuTimeoutRef.current) {
      clearTimeout(categoryMenuTimeoutRef.current)
    }

    categoryMenuTimeoutRef.current = setTimeout(() => {
      setVisibleCategory(category)
      setIsCategoryMenuOpen(true)
    }, CATEGORY_MENU_TRANSITION_MS)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-16 lg:py-24">
        <div className="section-shell text-center">
          <h1 className="mb-4 text-3xl font-bold text-white lg:text-4xl">Pedi tu cotizacion</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Elegi el tipo de seguro y completa el formulario. Te contactamos con las mejores opciones segun lo que
            necesitas.
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
            <h2 className="section-title mt-3 mb-4">¿Que queres asegurar?</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Selecciona una categoria en el menu y abajo se despliegan las opciones.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              {productCategories.map((group) => {
                const isActive = selectedCategory === group.category

                return (
                  <button
                    key={group.category}
                    type="button"
                    onClick={() => handleCategoryChange(group.category)}
                    className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'border-brand-900 bg-brand-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {group.category}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {group.items.length}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition ${isActive ? 'rotate-180' : ''}`} />
                  </button>
                )
              })}
            </div>

            {activeCategory && (
              <div
                className={`overflow-hidden rounded-3xl bg-slate-50 transition-all ease-in-out ${
                  isCategoryMenuOpen
                    ? 'max-h-[2400px] translate-y-0 border border-slate-200 p-6 opacity-100 lg:p-8'
                    : 'pointer-events-none max-h-0 -translate-y-2 border border-transparent p-0 opacity-0'
                }`}
                style={{ transitionDuration: `${CATEGORY_MENU_TRANSITION_MS}ms` }}
              >
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu desplegado</p>
                    <h3 className="text-2xl font-bold text-slate-900">{activeCategory.category}</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {activeCategory.items.length} opciones
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {activeCategory.items.map((item) => {
                    const isSelected = selectedInsuranceType === item.title

                    return (
                      <article
                        key={item.title}
                        className={`flex flex-col rounded-2xl border bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                          isCategoryMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                        } ${
                          isSelected ? 'border-brand-200 ring-2 ring-brand-900/20' : 'border-slate-100'
                        }`}
                      >
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                          <img src={item.iconPath} alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                        <p className="mb-5 text-sm text-slate-600">{item.description}</p>
                        <button
                          type="button"
                          onClick={() => handleSelectInsurance(item.title)}
                          className="btn-primary mt-auto w-full"
                        >
                          {isSelected ? 'Seleccionado' : 'Elegir y continuar'} <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
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
                <Suspense
                  fallback={
                    <p className="py-6 text-center text-sm text-slate-500">
                      Cargando formulario...
                    </p>
                  }
                >
                  <CotizacionForm key={selectedInsuranceType} sourcePage="Cotizacion" insuranceType={selectedInsuranceType} />
                </Suspense>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Elegi un tipo de seguro para continuar</h2>
              <p className="mt-2 text-slate-600">Selecciona una opcion en el menu de arriba y se habilita el formulario.</p>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="mb-3 text-slate-600">¿Preferis chatear directamente?</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-[#25D366] transition hover:text-[#20BA5C]"
            >
              <WhatsAppIcon className="h-5 w-5" /> Escribinos por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
