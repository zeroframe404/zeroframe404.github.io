import { Outlet } from 'react-router-dom'
import { useAdaptiveSectionSnap } from '../../hooks/useAdaptiveSectionSnap'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'
import WhatsAppFloat from './WhatsAppFloat'

export default function SiteLayout() {
  useAdaptiveSectionSnap()

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1 pt-16 lg:pt-20">
        <Outlet />
      </main>
      <SiteFooter />
      <WhatsAppFloat />
    </div>
  )
}
