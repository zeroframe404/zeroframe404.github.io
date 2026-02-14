import { Clock3, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  NAV_ITEMS,
  SITE_NAME
} from '../../config/site'

export default function SiteFooter() {
  return (
    <footer className="bg-brand-950 text-white">
      <div className="section-shell py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <img
                src="/logo.png"
                alt={`Logo ${SITE_NAME}`}
                className="h-12 w-12 rounded-full border border-white/20 bg-white object-cover p-0.5"
              />
              <h3 className="text-lg font-bold">{SITE_NAME}</h3>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Tu tranquilidad es nuestra prioridad. Asesoramiento personalizado en
              seguros de autos y motos.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Navegación
            </h4>
            <ul className="space-y-3">
              {NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="text-sm text-slate-300 transition hover:text-sky-300"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Contacto
            </h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-sky-300" /> {CONTACT_PHONE}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-sky-300" /> {CONTACT_EMAIL}
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-sky-300" /> Dock Sud,
                Avellaneda, Buenos Aires
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Horarios
            </h4>
            <div className="flex gap-2 text-sm text-slate-300">
              <Clock3 className="mt-0.5 h-4 w-4 text-sky-300" />
              <div>
                <p>Lunes a Viernes</p>
                <p className="font-semibold text-white">9:00 a 18:00 hs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} {SITE_NAME}. Todos los derechos
            reservados.
          </p>
          <p className="max-w-lg text-center text-xs text-slate-500 md:text-right">
            Las cotizaciones son orientativas y sujetas a evaluación. Las
            coberturas dependen de la aseguradora y condiciones de cada póliza.
          </p>
        </div>
      </div>
    </footer>
  )
}
