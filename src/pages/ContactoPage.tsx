import { Clock3, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import ContactoForm from '../components/forms/ContactoForm'
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  WHATSAPP_COTIZACION_MESSAGE,
  buildWhatsAppUrl
} from '../config/site'

const cards = [
  {
    title: 'WhatsApp',
    value: CONTACT_PHONE,
    description: 'Escribinos cuando quieras',
    link: buildWhatsAppUrl(WHATSAPP_COTIZACION_MESSAGE),
    highlight: true,
    icon: MessageCircle
  },
  {
    title: 'Teléfono',
    value: CONTACT_PHONE,
    description: 'Lun a Vie de 9 a 18hs',
    icon: Phone
  },
  {
    title: 'Email',
    value: CONTACT_EMAIL,
    description: 'Te respondemos en el día',
    link: `mailto:${CONTACT_EMAIL}`,
    icon: Mail
  },
  {
    title: 'Ubicación',
    value: 'Dock Sud, Avellaneda',
    description: 'Buenos Aires, Argentina',
    icon: MapPin
  }
]

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-16 lg:py-24">
        <div className="section-shell text-center">
          <h1 className="mb-4 text-3xl font-bold text-white lg:text-4xl">Contacto</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            ¿Tenés alguna consulta? Escribinos y te respondemos a la brevedad.
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
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${card.highlight ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-blue-50 text-brand-900'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 font-semibold text-slate-900">{card.title}</h3>
                    {card.link ? (
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

            <div className="rounded-xl bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Horarios de atención</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Lunes a Viernes</span>
                  <span className="font-medium text-slate-900">9:00 - 18:00 hs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sábados y Domingos</span>
                  <span className="text-slate-500">Cerrado</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                * Por WhatsApp podés dejarnos tu mensaje fuera de horario y te respondemos al siguiente día hábil.
              </p>
            </div>
          </div>

          <div>
            <div className="rounded-2xl bg-white p-6 shadow-soft sm:p-8">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">Escribinos</h2>
              <ContactoForm sourcePage="Contacto" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="h-64 bg-slate-200 lg:h-80">
          <div className="section-shell flex h-full items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <p className="text-slate-500">Dock Sud, Avellaneda, Buenos Aires</p>
              <p className="mt-1 text-sm text-slate-400">(Mapa próximamente)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
