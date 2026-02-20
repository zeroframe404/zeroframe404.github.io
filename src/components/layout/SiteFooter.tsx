import { AnimatePresence, motion } from 'framer-motion'
import { Clock3, Mail, MapPin, Phone, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LICENSE_NUMBER, NAV_ITEMS, SITE_NAME } from '../../config/site'

type SocialPlatform = 'instagram' | 'facebook'

const SOCIAL_BRANCH_LINKS: Record<
  SocialPlatform,
  {
    label: string
    branches: Array<{ name: string; url: string }>
  }
> = {
  instagram: {
    label: 'Instagram',
    branches: [
      { name: 'Avellaneda', url: 'https://www.instagram.com/segurosdocksud' },
      { name: 'Lanus', url: 'https://www.instagram.com/seguroslanus_/' }
    ]
  },
  facebook: {
    label: 'Facebook',
    branches: [
      {
        name: 'Avellaneda',
        url: 'https://www.facebook.com/brokersdesegurosavellanedagrup'
      },
      { name: 'Lanus', url: 'https://www.facebook.com/seguros.lanus' }
    ]
  }
}

export default function SiteFooter() {
  const [activeModal, setActiveModal] = useState<SocialPlatform | null>(null)
  const selectedPlatform = activeModal ? SOCIAL_BRANCH_LINKS[activeModal] : null

  useEffect(() => {
    if (!activeModal) return

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModal(null)
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onEscape)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      window.removeEventListener('keydown', onEscape)
    }
  }, [activeModal])

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
            <div className="mt-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
                Redes sociales
              </h4>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('instagram')}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 transition hover:border-sky-300 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Abrir Instagram"
                >
                  <img
                    src="/redes_sociales/Instragram.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-6 object-contain"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('facebook')}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 transition hover:border-sky-300 hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Abrir Facebook"
                >
                  <img
                    src="/redes_sociales/Facebook.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-6 object-contain"
                  />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Navegaci&oacute;n
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
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 flex-none text-sky-300" />
                <div className="min-w-0 space-y-1">
                  <p className="break-words">
                    <span className="font-semibold">WhatsApp Avellaneda:</span>{' '}
                    +54 9 11 4083-0416
                  </p>
                  <p className="break-words">
                    <span className="font-semibold">WhatsApp Lanus:</span>{' '}
                    +54 9 11 3694-2482
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 flex-none text-sky-300" />
                <div className="min-w-0 space-y-1">
                  <p className="break-words">
                    <span className="font-semibold">Avellaneda:</span>{' '}
                    segurosdocksud@gmail.com
                  </p>
                  <p className="break-words">
                    <span className="font-semibold">Lanus</span>
                  </p>
                  <p className="break-words">seguroslanus2@gmail.com</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-sky-300" />
                <div className="min-w-0 space-y-1">
                  <p className="break-words">
                    <span className="font-semibold">Avellaneda</span>
                  </p>
                  <p className="break-words">
                    Manuel Estevez 1234, B1871 Dock Sud, Provincia de Buenos Aires
                  </p>
                  <p className="break-words">
                    <span className="font-semibold">Lanus</span>
                  </p>
                  <p className="break-words">
                    Centenario Uruguayo 1209, B1825 Lanús, Provincia de Buenos Aires
                  </p>
                </div>
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
            &copy; {new Date().getFullYear()} {SITE_NAME}. Todos los derechos
            reservados.
          </p>
          <p className="max-w-lg text-center text-xs text-slate-500 md:text-right">
            Las cotizaciones son orientativas y sujetas a evaluaci&oacute;n. Las
            coberturas dependen de la aseguradora y condiciones de cada p&oacute;liza.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {selectedPlatform && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="social-modal-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl sm:p-7"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {selectedPlatform.label}
                  </p>
                  <h5 id="social-modal-title" className="mt-1 text-xl font-bold">
                    Elegir sucursal
                  </h5>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label="Cerrar ventana"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedPlatform.branches.map((branch) => (
                  <a
                    key={branch.name}
                    href={branch.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary w-full justify-center text-sm"
                    onClick={() => setActiveModal(null)}
                  >
                    {branch.name}
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  )
}
