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

const HomePage = lazy(loadHomePage)
const CotizacionPage = lazy(loadCotizacionPage)
const CoberturasPage = lazy(loadCoberturasPage)
const SiniestrosPage = lazy(loadSiniestrosPage)
const NosotrosPage = lazy(loadNosotrosPage)
const ContactoPage = lazy(loadContactoPage)
const NotFoundPage = lazy(loadNotFoundPage)

export function AppRoutes() {
  return (
    <Routes>
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
