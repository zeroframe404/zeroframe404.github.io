import { useEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 1024px)'
const CAN_ANIMATE_QUERY =
  '(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'

function getMediaMatch(query: string) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(query).matches
}

function subscribeMediaQuery(query: string, onChange: () => void) {
  const mediaQuery = window.matchMedia(query)

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onChange)
    return () => mediaQuery.removeEventListener('change', onChange)
  }

  mediaQuery.addListener(onChange)
  return () => mediaQuery.removeListener(onChange)
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => getMediaMatch(DESKTOP_QUERY))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const sync = () => {
      setIsDesktop(getMediaMatch(DESKTOP_QUERY))
    }

    sync()
    return subscribeMediaQuery(DESKTOP_QUERY, sync)
  }, [])

  return isDesktop
}

export function useCanAnimate() {
  const [canAnimate, setCanAnimate] = useState(() => getMediaMatch(CAN_ANIMATE_QUERY))

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const sync = () => {
      setCanAnimate(getMediaMatch(CAN_ANIMATE_QUERY))
    }

    sync()
    return subscribeMediaQuery(CAN_ANIMATE_QUERY, sync)
  }, [])

  return canAnimate
}
