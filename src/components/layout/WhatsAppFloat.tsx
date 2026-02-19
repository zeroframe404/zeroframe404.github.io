import WhatsAppIcon from '../icons/WhatsAppIcon'
import { WHATSAPP_COTIZACION_MESSAGE } from '../../config/site'

const AVELLANEDA_WHATSAPP_NUMBER = '5491140830416'
const avellanedaWhatsAppUrl = `https://wa.me/${AVELLANEDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_COTIZACION_MESSAGE)}`

export default function WhatsAppFloat() {
  return (
    <a
      aria-label="Contactar por WhatsApp"
      href={avellanedaWhatsAppUrl}
      target="_blank"
      rel="noreferrer"
      className="whatsapp-float group fixed bottom-4 right-4 z-50 rounded-full bg-[#25D366] p-3 text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-[#20BA5C] active:scale-95 sm:bottom-6 sm:right-6 sm:p-4"
    >
      <WhatsAppIcon className="h-6 w-6 sm:h-7 sm:w-7" tone="white" />
      <span className="absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow group-hover:block">
        Chatea con nosotros
      </span>
    </a>
  )
}
