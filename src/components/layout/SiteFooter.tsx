import { Clock3, Mail, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CONTACT_PHONE,
  LICENSE_NUMBER,
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
                src="/optimized/logo-96.webp"
                alt={`Logo ${SITE_NAME}`}
                width={48}
                height={48}
                loading="lazy"
                decoding="async"
                className="h-11 w-11 rounded-full border border-white/20 bg-white object-cover p-0.5 sm:h-12 sm:w-12"
              />
              <div className="min-w-0">
                <h3 className="text-base font-bold sm:text-lg">{SITE_NAME}</h3>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-300 sm:text-xs">
                  {LICENSE_NUMBER}
                </p>
              </div>
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
                <Phone className="h-4 w-4 flex-none text-sky-300" /> {CONTACT_PHONE}
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-none text-sky-300" />
                <div className="min-w-0 space-y-1">
                  <p className="break-words">Avellaneda: segurosdocksud@gmail.com</p>
                  <p className="break-words">Lanús: seguroslanus2@gmail.com</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-sky-300" />
                <span>Dock Sud, Avellaneda, Buenos Aires</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Horarios
            </h4>
            <div className="flex gap-2 text-sm leading-relaxed text-slate-300">
              <Clock3 className="mt-0.5 h-4 w-4 flex-none text-sky-300" />
              <div className="space-y-1">
                <p>
                  <span className="font-semibold text-white">Lunes:</span> Cerrado
                </p>
                <p>
                  <span className="font-semibold text-white">Martes:</span> Cerrado
                </p>
                <p>
                  <span className="font-semibold text-white">Miercoles:</span> 09:00 a
                  13:00 y de 15:00 a 19:00
                </p>
                <p>
                  <span className="font-semibold text-white">Jueves:</span> 09:00 a
                  13:00 y de 15:00 a 19:00
                </p>
                <p>
                  <span className="font-semibold text-white">Viernes:</span> 09:00 a
                  13:00 y de 15:00 a 19:00
                </p>
                <p>
                  <span className="font-semibold text-white">Sabado:</span> 09:00 a
                  14:00
                </p>
                <p>
                  <span className="font-semibold text-white">Domingo:</span> Cerrado
                </p>
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
