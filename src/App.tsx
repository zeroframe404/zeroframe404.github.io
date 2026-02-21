import { lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import {
  loadCoberturasPage,
  loadContactoPage,
  loadCotizacionPage,
  loadHomePage,
  loadNosotrosPage,
  loadNotFoundPage,
  loadSiniestrosPage
} from './config/moduleLoaders'

function normalizeHiddenAdminPath(rawPath: string | undefined) {
  if (!rawPath) {
    return null
  }

  const trimmedPath = rawPath.trim()
  if (!trimmedPath) {
    return null
  }

  const withoutHashPrefix = trimmedPath.replace(/^#\/?/, '')
  const normalizedSlug = withoutHashPrefix.replace(/^\/+|\/+$/g, '')
  if (!normalizedSlug) {
    return null
  }

  return `/${normalizedSlug}`
}

const adminHiddenPath = normalizeHiddenAdminPath(
  import.meta.env.VITE_ADMIN_HIDDEN_PATH
)

const HomePage = lazy(loadHomePage)
const CotizacionPage = lazy(loadCotizacionPage)
const CoberturasPage = lazy(loadCoberturasPage)
const SiniestrosPage = lazy(loadSiniestrosPage)
const NosotrosPage = lazy(loadNosotrosPage)
const ContactoPage = lazy(loadContactoPage)
const NotFoundPage = lazy(loadNotFoundPage)
const AdminHiddenPage = lazy(() => import('./pages/AdminHiddenPage'))

export function AppRoutes() {
  return (
    <Routes>
      {adminHiddenPath && (
        <Route path={adminHiddenPath} element={<AdminHiddenPage />} />
      )}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<HomePage />} />
        <Route path="/Cotizacion" element={<CotizacionPage />} />
        <Route path="/Coberturas" element={<CoberturasPage />} />
        <Route path="/Siniestros" element={<SiniestrosPage />} />
        <Route path="/Nosotros" element={<NosotrosPage />} />
        <Route path="/Contacto" element={<ContactoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
