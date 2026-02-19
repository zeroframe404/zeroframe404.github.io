type WhatsAppIconProps = {
  className?: string
  tone?: 'brand' | 'white'
}

export default function WhatsAppIcon({ className, tone = 'brand' }: WhatsAppIconProps) {
  const toneClass = tone === 'white' ? 'brightness-0 invert' : ''
  const classes = ['object-contain', toneClass, className].filter(Boolean).join(' ')

  return <img src="/Whatsapp.svg" alt="" aria-hidden="true" className={classes} />
}
