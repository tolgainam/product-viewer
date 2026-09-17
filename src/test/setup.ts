/**
 * Vitest setup — adds jest-dom matchers and a matchMedia stub for MUI's useMediaQuery.
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import '@testing-library/jest-dom/vitest'

/**
 * jsdom has no IntersectionObserver; framer-motion's useInView needs one for the
 * desktop scroll animation. This stub never reports intersections, which is fine —
 * the tests assert content, not the fade-in.
 */
if (!('IntersectionObserver' in globalThis)) {
  class IntersectionObserverStub implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver
}

/** jsdom has no matchMedia; tests override the `matches` value per layout. */
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}
