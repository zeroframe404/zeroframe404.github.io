const fallbackWhatsApp = '5491100000000'
const fallbackPhone = '+54 9 11 0000-0000'
const fallbackEmail = 'contacto@segurosdocksud.com'

const sanitizeNumber = (value: string) => value.replace(/\D/g, '')

export const SITE_NAME = 'Broker de seguros Daniel Martinez'
export const SITE_SHORT_NAME = 'Daniel Martinez'
export const LICENSE_NUMBER = 'Matrícula N°77284'
export const WHATSAPP_NUMBER = sanitizeNumber(
  import.meta.env.VITE_WHATSAPP_NUMBER ?? fallbackWhatsApp
)
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE ?? fallbackPhone
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL ?? fallbackEmail

export const NAV_ITEMS = [
  { name: 'Inicio', path: '/Home' },
  { name: 'Cotizar', path: '/Cotizacion' },
  { name: 'Coberturas', path: '/Coberturas' },
  { name: 'Siniestros', path: '/Siniestros' },
  { name: 'Nosotros', path: '/Nosotros' },
  { name: 'Contacto', path: '/Contacto' }
]

export const WHATSAPP_COTIZACION_MESSAGE =
  'Hola me interesa cotizar un seguro'

export const WHATSAPP_SINIESTRO_MESSAGE =
  'Hola! Necesito reportar un siniestro.'

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
