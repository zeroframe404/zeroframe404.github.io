import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import {
  WHATSAPP_COTIZACION_MESSAGE,
  buildWhatsAppUrl
} from '../../config/site'

export default function WhatsAppFloat() {
  return (
    <motion.a
      aria-label="Contactar por WhatsApp"
      href={buildWhatsAppUrl(WHATSAPP_COTIZACION_MESSAGE)}
      target="_blank"
      rel="noreferrer"
      className="group fixed bottom-6 right-6 z-50 rounded-full bg-[#25D366] p-4 text-white shadow-lg transition hover:bg-[#20BA5C]"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8, type: 'spring', stiffness: 180 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.96 }}
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow group-hover:block">
        ¡Chateá con nosotros!
      </span>
    </motion.a>
  )
}
