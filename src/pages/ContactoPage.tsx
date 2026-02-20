import { Clock3, Mail, MapPin, Phone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import WhatsAppIcon from '../components/icons/WhatsAppIcon'

const ContactoForm = lazy(() => import('../components/forms/ContactoForm'))

type BranchValue = {
  branch: string
  value: string
}

type BranchLink = {
  branch: string
  url: string
}

type ContactCard = {
  title: string
  description: string
  icon?: LucideIcon
  useWhatsAppIcon?: boolean
  highlight?: boolean
  branchValues?: BranchValue[]
  value?: string
  link?: string
}

const branchContacts: BranchValue[] = [
  {
    branch: 'Avellaneda',
    value: '+54 9 11 4083-0416'
  },
  {
    branch: 'Lanus',
    value: '+54 9 11 3694-2482'
  }
]

const branchEmails: BranchValue[] = [
  {
    branch: 'Avellaneda',
    value: 'segurosdocksud@gmail.com'
  },
  {
    branch: 'Lanus',
    value: 'Seguroslanus2@gmail.com'
  }
]

const socialCards: Array<{
  title: string
  icon: string
  description: string
  branchLinks: BranchLink[]
}> = [
  {
    title: 'Instagram',
    icon: '/redes_sociales/Instragram.svg',
    description: 'Elegi la sucursal para abrir el perfil.',
    branchLinks: [
      { branch: 'Avellaneda', url: 'https://www.instagram.com/segurosdocksud' },
      { branch: 'Lanus', url: 'https://www.instagram.com/seguroslanus_/' }
    ]
  },
  {
    title: 'Facebook',
    icon: '/redes_sociales/Facebook.svg',
    description: 'Elegi la sucursal para abrir la pagina.',
    branchLinks: [
      {
        branch: 'Avellaneda',
        url: 'https://www.facebook.com/brokersdesegurosavellanedagrup'
      },
      { branch: 'Lanus', url: 'https://www.facebook.com/seguros.lanus' }
    ]
  }
]

const branchMaps = [
  {
    branch: 'Avellaneda',
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d205.14101989592174!2d-58.34735856971683!3d-34.64822918966067!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a333603e81a575%3A0xcb5e9949a7676583!2sbrokers%20de%20seguros%20avellaneda!5e0!3m2!1sen!2sar!4v1771499473143!5m2!1sen!2sar',
    link: 'https://maps.google.com/?q=ATM+Seguros+Avellaneda',
    address: 'Manuel Estevez 1234, B1871 Dock Sud, Provincia de Buenos Aires'
  },
  {
    branch: 'Lanus',
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d204.9638994516236!2d-58.35957901396295!3d-34.71974597568886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a332baa311bba1%3A0x6d7c4adeeb0c8f42!2sAtm%20Seguros!5e0!3m2!1sen!2sar!4v1771499511741!5m2!1sen!2sar',
    link: 'https://maps.google.com/?q=ATM+Seguros+Lanus',
    address: 'Centenario Uruguayo 1209, B1825 Lanús, Provincia de Buenos Aires'
  }
]

const cards: ContactCard[] = [
  {
    title: 'WhatsApp',
    branchValues: branchContacts,
    description: 'Escribinos cuando quieras',
    highlight: true,
    useWhatsAppIcon: true
  },
  {
    title: 'Telefono',
    branchValues: branchContacts,
    description: 'Mie a Vie 09-13 y 15-19, Sab 09-14',
    icon: Phone
  },
  {
    title: 'Email',
    branchValues: branchEmails,
    description: 'Te respondemos en el dia',
    icon: Mail
  },
  {
    title: 'Ubicacion',
    value: 'Avellaneda y Lanus',
    description: 'Buenos Aires, Argentina',
    icon: MapPin
  }
]

export default function ContactoPage() {
  const [openedMaps, setOpenedMaps] = useState<Record<string, boolean>>({})

  const openMap = (branch: string) => {
    setOpenedMaps((prev) => ({ ...prev, [branch]: true }))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-16 lg:py-24">
        <div className="section-shell text-center">
          <h1 className="mb-4 text-3xl font-bold text-white lg:text-4xl">Contacto</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            ¿Tenes alguna consulta? Escribinos y te respondemos a la brevedad.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="section-shell grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="mb-8 text-2xl font-bold text-slate-900">Hablemos</h2>

            <div className="mb-12 grid gap-6 sm:grid-cols-2">
              {cards.map((card) => {
                const Icon = card.icon
                return (
                  <article
                    key={card.title}
                    className={`rounded-xl bg-white p-6 ${card.highlight ? 'ring-2 ring-[#25D366] ring-offset-2' : ''}`}
                  >
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.highlight ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-blue-50 text-brand-900'}`}
                    >
                      {card.useWhatsAppIcon ? (
                        <WhatsAppIcon className="h-6 w-6" />
                      ) : Icon ? (
                        <Icon className="h-6 w-6" />
                      ) : null}
                    </div>
                    <h3 className="mb-1 font-semibold text-slate-900">{card.title}</h3>
                    {card.branchValues ? (
                      <div className="space-y-1">
                        {card.branchValues.map((branchValue) => (
                          <p key={`${card.title}-${branchValue.branch}`} className="break-words text-sm">
                            <span className="font-semibold text-slate-700">{branchValue.branch}:</span>{' '}
                            <span className={`font-medium ${card.highlight ? 'text-[#25D366]' : 'text-brand-900'}`}>
                              {branchValue.value}
                            </span>
                          </p>
                        ))}
                      </div>
                    ) : card.link ? (
                      <a
                        href={card.link}
                        target={card.link.startsWith('http') ? '_blank' : undefined}
                        rel={card.link.startsWith('http') ? 'noreferrer' : undefined}
                        className={`font-medium hover:underline ${card.highlight ? 'text-[#25D366]' : 'text-brand-900'}`}
                      >
                        {card.value}
                      </a>
                    ) : (
                      <p className="font-medium text-slate-900">{card.value}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-500">{card.description}</p>
                  </article>
                )
              })}
            </div>

            <div className="mb-12 grid gap-6 sm:grid-cols-2">
              {socialCards.map((card) => (
                <article key={card.title} className="rounded-xl bg-white p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                      <img
                        src={card.icon}
                        alt=""
                        aria-hidden="true"
                        className="h-6 w-6 object-contain"
                      />
                    </div>
                    <h3 className="font-semibold text-slate-900">{card.title}</h3>
                  </div>
                  <p className="mb-4 text-sm text-slate-500">{card.description}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {card.branchLinks.map((branchLink) => (
                      <a
                        key={`${card.title}-${branchLink.branch}`}
                        href={branchLink.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary w-full justify-center text-sm"
                      >
                        {branchLink.branch}
                      </a>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-xl bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Horarios de atencion</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Lunes</span>
                  <span className="text-slate-500">Cerrado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Martes</span>
                  <span className="text-slate-500">Cerrado</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Miercoles</span>
                  <span className="text-right font-medium text-slate-900">
                    09:00 a 13:00 y de 15:00 a 19:00
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Jueves</span>
                  <span className="text-right font-medium text-slate-900">
                    09:00 a 13:00 y de 15:00 a 19:00
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Viernes</span>
                  <span className="text-right font-medium text-slate-900">
                    09:00 a 13:00 y de 15:00 a 19:00
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-600">Sabado</span>
                  <span className="font-medium text-slate-900">09:00 a 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Domingo</span>
                  <span className="text-slate-500">Cerrado</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                * Por WhatsApp podes dejarnos tu mensaje fuera de horario y te respondemos al siguiente dia habil.
              </p>
            </div>
          </div>

          <div>
            <div className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Escribinos</h2>
              <Suspense
                fallback={
                  <p className="py-6 text-center text-sm text-slate-500">
                    Cargando formulario...
                  </p>
                }
              >
                <ContactoForm sourcePage="Contacto" />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="section-shell">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Nuestras sucursales</h2>
            <p className="mt-2 text-slate-600">Avellaneda y Lanus, Buenos Aires</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {branchMaps.map((branchMap) => {
              const isMapOpen = Boolean(openedMaps[branchMap.branch])

              return (
                <article key={branchMap.branch} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <MapPin className="h-4 w-4 text-brand-900" />
                    {branchMap.branch}
                  </div>

                  {isMapOpen ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <iframe
                        src={branchMap.src}
                        title={`Mapa ${branchMap.branch}`}
                        width="600"
                        height="450"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-72 w-full lg:h-80"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                      <button
                        type="button"
                        onClick={() => openMap(branchMap.branch)}
                        className="btn-primary w-full sm:w-auto"
                      >
                        Ver mapa
                      </button>
                      <a
                        href={branchMap.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block text-sm font-medium text-brand-900 hover:underline"
                      >
                        Abrir en Google Maps
                      </a>
                    </div>
                  )}

                  <p className="mt-4 text-sm text-slate-700">
                    <span className="font-semibold">{branchMap.branch}:</span> {branchMap.address}
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
