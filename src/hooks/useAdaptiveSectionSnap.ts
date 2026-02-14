import { useEffect, useRef } from 'react'

const AUTO_SCROLL_LOCK_MS = 650

function getHeaderOffset() {
  return window.innerWidth >= 1024 ? 80 : 64
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(
    target.closest(
      'input, textarea, select, option, button, a, [contenteditable="true"]'
    )
  )
}

function getSections() {
  return Array.from(
    document.querySelectorAll<HTMLElement>('main > div > section')
  )
}

function getCurrentSectionIndex(sections: HTMLElement[]) {
  const markerY = window.scrollY + getHeaderOffset() + 2
  let index = 0

  for (let i = 0; i < sections.length; i += 1) {
    const top = sections[i].getBoundingClientRect().top + window.scrollY
    if (top <= markerY) {
      index = i
    } else {
      break
    }
  }

  return index
}

export function useAdaptiveSectionSnap() {
  const isAutoScrollingRef = useRef(false)
  const wheelTimeRef = useRef(0)
  const touchStartYRef = useRef<number | null>(null)
  const touchStartTimeRef = useRef(0)
  const lockTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const lockAutoScroll = () => {
      isAutoScrollingRef.current = true
      if (lockTimerRef.current) {
        window.clearTimeout(lockTimerRef.current)
      }
      lockTimerRef.current = window.setTimeout(() => {
        isAutoScrollingRef.current = false
      }, AUTO_SCROLL_LOCK_MS)
    }

    const snapToSection = (direction: 1 | -1) => {
      const sections = getSections()
      if (sections.length < 2) {
        return
      }

      const currentIndex = getCurrentSectionIndex(sections)
      const nextIndex = Math.min(
        sections.length - 1,
        Math.max(0, currentIndex + direction)
      )

      if (nextIndex === currentIndex) {
        return
      }

      const target = sections[nextIndex]
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - getHeaderOffset()

      lockAutoScroll()
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth'
      })
    }

    const handleWheel = (event: WheelEvent) => {
      if (isAutoScrollingRef.current || isInteractiveTarget(event.target)) {
        return
      }

      const delta = event.deltaY
      const absDelta = Math.abs(delta)
      if (absDelta < 2) {
        return
      }

      const now = performance.now()
      const dt = now - wheelTimeRef.current
      wheelTimeRef.current = now
      const velocity = absDelta / Math.max(dt, 1)

      const isGentleScroll = absDelta <= 40 && velocity <= 1
      const isFastScroll = absDelta >= 80 || velocity >= 2.2

      if (isFastScroll) {
        return
      }

      if (isGentleScroll) {
        event.preventDefault()
        snapToSection(delta > 0 ? 1 : -1)
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        touchStartYRef.current = null
        return
      }

      if (isInteractiveTarget(event.target)) {
        touchStartYRef.current = null
        return
      }

      touchStartYRef.current = event.touches[0].clientY
      touchStartTimeRef.current = performance.now()
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (isAutoScrollingRef.current || touchStartYRef.current === null) {
        return
      }

      const endY = event.changedTouches[0]?.clientY
      if (typeof endY !== 'number') {
        return
      }

      const delta = touchStartYRef.current - endY
      const absDelta = Math.abs(delta)
      touchStartYRef.current = null

      if (absDelta < 8) {
        return
      }

      const dt = performance.now() - touchStartTimeRef.current
      const velocity = absDelta / Math.max(dt, 1)

      const isGentleSwipe = absDelta <= 90 && velocity <= 0.45
      const isFastSwipe = absDelta >= 140 || velocity >= 1

      if (isFastSwipe) {
        return
      }

      if (isGentleSwipe) {
        snapToSection(delta > 0 ? 1 : -1)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      if (lockTimerRef.current) {
        window.clearTimeout(lockTimerRef.current)
      }
    }
  }, [])
}
