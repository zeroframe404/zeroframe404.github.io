export const loadHomePage = () => import('../pages/HomePage')
export const loadCotizacionPage = () => import('../pages/CotizacionPage')
export const loadCoberturasPage = () => import('../pages/CoberturasPage')
export const loadSiniestrosPage = () => import('../pages/SiniestrosPage')
export const loadNosotrosPage = () => import('../pages/NosotrosPage')
export const loadContactoPage = () => import('../pages/ContactoPage')
export const loadNotFoundPage = () => import('../pages/NotFoundPage')

export const loadCotizacionForm = () =>
  import('../components/forms/CotizacionForm')
export const loadContactoForm = () => import('../components/forms/ContactoForm')
export const loadSiniestroReportForm = () =>
  import('../components/forms/SiniestroReportForm')

export const sectionLoaders = [
  loadHomePage,
  loadCotizacionPage,
  loadCoberturasPage,
  loadSiniestrosPage,
  loadNosotrosPage,
  loadContactoPage,
  loadNotFoundPage,
  loadCotizacionForm,
  loadContactoForm,
  loadSiniestroReportForm
]
