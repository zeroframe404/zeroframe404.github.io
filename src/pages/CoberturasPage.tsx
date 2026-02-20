import { ArrowRight, Check, Flame, Shield, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Responsabilidad Civil',
    description:
      'La cobertura básica y obligatoria por ley. Cubre los daños que tu vehículo pueda causar a terceros (personas y bienes).',
    features: [
      'Daños materiales a terceros',
      'Daños corporales a terceros',
      'Defensa legal incluida',
      'Cobertura obligatoria por ley'
    ],
    ideal: 'Ideal si buscás la cobertura mínima obligatoria a menor costo.',
    color: 'bg-blue-50 text-blue-600'
  },
  {
    name: 'Terceros Completo',
    description:
      'Incluye Responsabilidad Civil más protección ante robo, incendio y daños por granizo. La opción más elegida.',
    features: [
      'Responsabilidad Civil',
      'Robo total y parcial',
      'Incendio total y parcial',
      'Daños por granizo',
      'Rotura de cristales (según póliza)'
    ],
    ideal: 'Ideal si querés buena protección a un precio accesible.',
    popular: true,
    color: 'bg-green-50 text-green-600'
  },
  {
    name: 'Todo Riesgo',
    description:
      'La cobertura más completa. Cubre daños propios además de todo lo anterior, incluso si vos causaste el accidente.',
    features: [
      'Terceros Completo',
      'Daños propios por accidente',
      'Daños por maniobras propias',
      'Franquicia (fija o variable)',
      'Asistencia mecánica premium'
    ],
    ideal: 'Ideal para vehículos nuevos o de alto valor.',
    color: 'bg-purple-50 text-purple-600'
  }
]

const extras = [
  {
    name: 'Incendio',
    description: 'Daños por fuego, rayo o explosión',
    icon: Flame
  },
  {
    name: 'Granizo',
    description: 'Daños por fenómenos climáticos',
    icon: Shield
  },
  {
    name: 'Asistencia 24hs',
    description: 'Grúa, auxilio mecánico y cerrajería',
    icon: Truck
  }
]

export default function CoberturasPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-16 lg:py-24">
        <div className="section-shell text-center">
          <h1 className="mb-4 text-3xl font-bold text-white lg:text-4xl">Tipos de Cobertura</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            Conocé las opciones disponibles y elegí la que mejor se adapte a tus necesidades y presupuesto.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="section-shell">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-white p-8 transition hover:shadow-xl ${
                  plan.popular ? 'border-brand-500 shadow-lg' : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
                      Más elegido
                    </span>
                  </div>
                )}
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${plan.color}`}>
                  <Shield className="h-7 w-7" />
                </div>
                <h2 className="mb-3 text-xl font-bold text-slate-900">{plan.name}</h2>
                <p className="mb-6 text-slate-600">{plan.description}</p>
                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mb-6 text-sm italic text-slate-500">{plan.ideal}</p>
                <Link
                  to="/Cotizacion"
                  className={`btn w-full ${plan.popular ? 'bg-brand-900 text-white hover:bg-brand-800' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                >
                  Cotizar esta cobertura <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="section-shell">
          <h2 className="mb-12 text-center text-2xl font-bold text-slate-900">Coberturas adicionales incluidas</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {extras.map((extra) => {
              const Icon = extra.icon
              return (
                <article key={extra.name} className="rounded-xl bg-white p-6 text-center shadow-soft">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-brand-900">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{extra.name}</h3>
                  <p className="text-sm text-slate-600">{extra.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
