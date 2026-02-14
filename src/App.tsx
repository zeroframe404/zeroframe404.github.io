import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import CoberturasPage from './pages/CoberturasPage'
import ContactoPage from './pages/ContactoPage'
import CotizacionPage from './pages/CotizacionPage'
import HomePage from './pages/HomePage'
import NosotrosPage from './pages/NosotrosPage'
import NotFoundPage from './pages/NotFoundPage'
import SiniestrosPage from './pages/SiniestrosPage'

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
