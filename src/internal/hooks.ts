/**
 * Small DOM hooks used by both layouts.
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'

/** useLayoutEffect warns during server rendering; fall back to useEffect there */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

/**
 * Width of an element, kept current with ResizeObserver.
 *
 * Returns null until measured, and in environments without ResizeObserver (older browsers,
 * jsdom), so callers can fall back to a viewport media query.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null)

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    setWidth(el.getBoundingClientRect().width)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return width
}

/**
 * Calls `onSize` whenever the element's border-box size changes, including after web
 * fonts finish loading — the case a one-off measurement misses.
 */
export function useResizeCallback(
  ref: RefObject<HTMLElement | null>,
  onSize: (width: number, height: number) => void
): void {
  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    onSize(el.offsetWidth, el.offsetHeight)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => onSize(el.offsetWidth, el.offsetHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, onSize])
}

/** Whether a media query currently matches; false on the server and before hydration */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    // Safari < 14 only has the deprecated addListener
    if (typeof list.addEventListener === 'function') {
      list.addEventListener('change', update)
      return () => list.removeEventListener('change', update)
    }
    list.addListener(update)
    return () => list.removeListener(update)
  }, [query])

  return matches
}
