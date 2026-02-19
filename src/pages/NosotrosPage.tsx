import { Clock3, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const values = [
  {
    title: 'Transparencia',
    description: 'Sin letra chica ni sorpresas. Te explicamos todo en palabras simples antes de que tomes una decisión.',
    icon: Sparkles
  },
  {
    title: 'Rapidez',
    description: 'Valoramos tu tiempo. Cotizaciones en minutos, pólizas al instante, respuestas en el día.',
    icon: Clock3
  },
  {
    title: 'Acompañamiento',
    description: 'No somos un 0800. Somos personas reales que te asesoran y acompañan cuando más lo necesitás.',
    icon: Users
  }
]

const stats = [
  { value: '+500', label: 'Clientes activos' },
  { value: '+10', label: 'Años de experiencia' },
  { value: '24hs', label: 'Tiempo de respuesta' },
  { value: '100%', label: 'Compromiso' }
]

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-16 lg:py-24">
        <div className="section-shell text-center">
          <h1 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
            Sobre Broker de seguros Daniel Martinez
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Somos un equipo de asesores que cree en los seguros claros, accesibles y humanos.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="section-shell grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="section-subtitle">Nuestra historia</p>
            <h2 className="mt-3 mb-6 text-2xl font-bold text-slate-900 lg:text-3xl">Nació de una frustración</h2>
            <div className="space-y-4 leading-relaxed text-slate-600">
              <p>
                Broker de seguros Daniel Martinez nació de una experiencia que
                seguramente te suena: pasar horas buscando información sobre
                seguros, llamar a varios lugares y no entender nada de lo que te
                decían.
              </p>
              <p>
                Por eso decidimos hacer las cosas diferente. Creamos un servicio donde la transparencia y la simplicidad son la norma, no la excepción.
              </p>
              <p>
                Desde Dock Sud atendemos a clientes de toda la zona sur del Gran Buenos Aires y más allá. Porque la buena atención no tiene fronteras geográficas.
              </p>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&h=500&fit=crop"
              alt="Equipo de asesores"
              width={600}
              height={500}
              loading="lazy"
              decoding="async"
              className="rounded-2xl shadow-lg"
            />
            <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-xl">
              <div className="rounded-lg bg-blue-100 p-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Dock Sud</p>
                <p className="text-xs text-slate-500">Avellaneda, Buenos Aires</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="section-shell">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-brand-900">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24">
        <div className="section-shell">
          <div className="mb-14 text-center">
            <p className="section-subtitle">En qué creemos</p>
            <h2 className="section-title mt-3 mb-4">Nuestros valores</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {values.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-2xl border border-slate-100 bg-slate-50 p-8">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-brand-900">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="section-shell text-center">
          <h2 className="mb-4 text-2xl font-bold text-slate-900">¿Querés conocernos mejor?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-slate-600">
            Escribinos y charlemos. La primera consulta es siempre gratis y sin compromiso.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/Cotizacion" className="btn-primary">
              Pedir cotización
            </Link>
            <Link to="/Contacto" className="btn-outline">
              Contactarnos
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
