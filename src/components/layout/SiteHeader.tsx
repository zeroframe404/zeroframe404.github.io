import clsx from 'clsx'
import { Menu, Shield, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import {
  NAV_ITEMS,
  SITE_NAME,
  SITE_SHORT_NAME
} from '../../config/site'

export default function SiteHeader() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'rounded-lg px-4 py-2 text-sm font-medium transition',
      isActive
        ? 'bg-sky-100 text-brand-900'
        : 'text-slate-600 hover:bg-slate-100 hover:text-brand-900'
    )

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="section-shell">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Link to="/Home" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt={`Logo ${SITE_NAME}`}
              className="h-12 w-12 rounded-full border border-slate-200 bg-white object-cover p-0.5"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-brand-900 sm:text-base">
                Broker de seguros
              </p>
              <p className="-mt-0.5 text-xs font-medium text-sky-700 sm:text-sm">
                {SITE_SHORT_NAME}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClass}>
                {item.name}
              </NavLink>
            ))}
          </div>

          <Link to="/Cotizacion" className="btn-primary hidden lg:inline-flex">
            Cotizar Ahora
          </Link>

          <button
            type="button"
            aria-label="Abrir menú"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="space-y-1 border-t border-slate-100 py-4 lg:hidden">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}
            <NavLink
              to="/Cotizacion"
              className="btn-primary mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              <Shield className="mr-2 h-4 w-4" /> Cotizar Ahora
            </NavLink>
          </div>
        )}

        <span className="sr-only">{SITE_NAME}</span>
      </nav>
    </header>
  )
}
