import { motion, useReducedMotion } from 'framer-motion'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAdaptiveSectionSnap } from '../../hooks/useAdaptiveSectionSnap'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'
import WhatsAppFloat from './WhatsAppFloat'

export default function SiteLayout() {
  useAdaptiveSectionSnap()
  const location = useLocation()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1 pt-16 lg:pt-20">
        <motion.div
          key={location.pathname}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.16, ease: 'easeOut' }
              : { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <Outlet />
        </motion.div>
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </div>
  )
}
