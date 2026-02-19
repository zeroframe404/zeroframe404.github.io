import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAdaptiveSectionSnap } from '../../hooks/useAdaptiveSectionSnap'
import {
  captureSanitizedMarkup,
  isCacheableRoute,
  readPageSnapshot,
  savePageSnapshot
} from '../../lib/pageCache'
import { prefetchAllSectionsInBackground } from '../../lib/prefetchSections'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'
import WhatsAppFloat from './WhatsAppFloat'

function RouteCacheFallback({ pathname }: { pathname: string }) {
  const cachedHtml = useMemo(() => readPageSnapshot(pathname), [pathname])

  if (!cachedHtml) {
    return (
      <div className="section-shell py-12 text-center text-sm text-slate-500">
        Cargando...
      </div>
    )
  }

  return (
    <div
      aria-hidden="true"
      className="route-cache-fallback pointer-events-none select-none"
      dangerouslySetInnerHTML={{ __html: cachedHtml }}
    />
  )
}

export default function SiteLayout() {
  const location = useLocation()
  const enableHomeSnap = location.pathname === '/Home'
  const outletContainerRef = useRef<HTMLDivElement | null>(null)
  useAdaptiveSectionSnap(enableHomeSnap)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    prefetchAllSectionsInBackground()
  }, [])

  useEffect(() => {
    if (!isCacheableRoute(location.pathname)) {
      return
    }

    const timer = window.setTimeout(() => {
      const container = outletContainerRef.current
      if (!container) {
        return
      }

      const snapshot = captureSanitizedMarkup(container)
      if (!snapshot) {
        return
      }

      savePageSnapshot(location.pathname, snapshot)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1 pt-16 lg:pt-20">
        <div
          key={location.pathname}
          ref={outletContainerRef}
          className="route-fade-in"
        >
          <Suspense
            fallback={<RouteCacheFallback pathname={location.pathname} />}
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </div>
  )
}
