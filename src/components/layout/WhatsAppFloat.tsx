import { motion } from 'framer-motion'
import WhatsAppIcon from '../icons/WhatsAppIcon'
import { WHATSAPP_COTIZACION_MESSAGE } from '../../config/site'

const AVELLANEDA_WHATSAPP_NUMBER = '5491140830416'
const avellanedaWhatsAppUrl = `https://wa.me/${AVELLANEDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_COTIZACION_MESSAGE)}`

export default function WhatsAppFloat() {
  return (
    <motion.a
      aria-label="Contactar por WhatsApp"
      href={avellanedaWhatsAppUrl}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-6 right-6 z-50 rounded-full bg-[#25D366] p-4 text-white shadow-lg transition hover:bg-[#20BA5C]"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 180 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
    >
      <WhatsAppIcon className="h-7 w-7" tone="white" />
      <span className="absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow group-hover:block">
        ¡Chateá con nosotros!
      </span>
    </motion.a>
  )
}
