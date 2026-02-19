import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export default function SimulatedSuccessBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.86, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.36, ease: 'easeOut' }}
      className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-transparent"
    >
      <Check className="h-8 w-8 text-green-500" strokeWidth={3} />
    </motion.div>
  )
}
