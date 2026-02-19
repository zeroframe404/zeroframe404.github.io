import clsx from 'clsx'
import { Menu, Shield, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LICENSE_NUMBER,
  NAV_ITEMS,
  SITE_NAME,
  SITE_SHORT_NAME
} from '../../config/site'

export default function SiteHeader() {
  const [openPath, setOpenPath] = useState<string | null>(null)
  const location = useLocation()
  const isOpen = openPath === location.pathname

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'rounded-lg px-4 py-2 text-sm font-medium transition',
      isActive
        ? 'bg-sky-100 text-brand-900'
        : 'text-slate-600 hover:bg-slate-100 hover:text-brand-900'
    )

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold transition',
      isActive
        ? 'bg-sky-100 text-brand-900'
        : 'text-slate-700 hover:bg-slate-100'
    )

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="section-shell">
        <div className="flex h-16 items-center justify-between gap-3 lg:h-20">
          <Link to="/Home" className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <img
              src="/optimized/logo-96.webp"
              alt={`Logo ${SITE_NAME}`}
              width={48}
              height={48}
              decoding="async"
              className="h-10 w-10 rounded-full border border-slate-200 bg-white object-cover p-0.5 sm:h-11 sm:w-11 lg:h-12 lg:w-12"
            />
            <div className="min-w-0 leading-tight">
              <p className="hidden truncate text-xs font-semibold text-brand-900 min-[380px]:block sm:text-sm lg:text-base">
                Broker de seguros
              </p>
              <p className="-mt-0.5 truncate text-xs font-semibold text-sky-700 sm:text-xs lg:text-sm">
                {SITE_SHORT_NAME}
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:text-xs">
                {LICENSE_NUMBER}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={desktopLinkClass}>
                {item.name}
              </NavLink>
            ))}
          </div>

          <Link to="/Cotizacion" className="btn-primary hidden xl:inline-flex">
            Cotizar Ahora
          </Link>

          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={isOpen}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() =>
              setOpenPath((current) =>
                current === location.pathname ? null : location.pathname
              )
            }
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="border-t border-slate-100 pb-4 pt-3 lg:hidden">
            <div className="grid gap-1.5">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={mobileLinkClass}
                  onClick={() => setOpenPath(null)}
                >
                  {item.name}
                </NavLink>
              ))}
              <NavLink
                to="/Cotizacion"
                className="btn-primary mt-2 w-full justify-center rounded-xl py-3"
                onClick={() => setOpenPath(null)}
              >
                <Shield className="mr-2 h-4 w-4" /> Cotizar Ahora
              </NavLink>
            </div>
          </div>
        )}

        <span className="sr-only">{SITE_NAME}</span>
      </nav>
    </header>
  )
}
