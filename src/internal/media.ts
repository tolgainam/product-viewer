/**
 * Media helpers shared by the desktop and mobile layouts: which image fills the stage,
 * which file of a responsive image to fetch, and a few guards for content values that
 * end up in CSS.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import type {
  ProductViewerFeature,
  ProductViewerHero,
  ProductViewerVariant,
  ProductViewerVisualConfig,
  ResponsiveImage,
} from '../ProductViewer.types'

/** Viewport widths at which a ResponsiveImage switches between its sizes */
export const IMAGE_BREAKPOINTS = { medium: 600, large: 1200 } as const

/**
 * What the stage shows behind the pills: a backdrop that fills the stage, a foreground
 * that is letterboxed and centred (a product shot or cut-out), or both.
 */
export interface StageMedia {
  background?: ResponsiveImage
  foreground?: ResponsiveImage
}

interface StageContext {
  hero: ProductViewerHero
  selectedVariant?: ProductViewerVariant
  expandedFeature: ProductViewerFeature | null
  /** Whether a model renderer is available — with one, a model paints its own canvas */
  hasModelRenderer: boolean
}

/** The image to draw on the stage for the current state, or null when nothing should be drawn */
export function stageMediaFor({ hero, selectedVariant, expandedFeature, hasModelRenderer }: StageContext): StageMedia | null {
  const productShot = selectedVariant?.image ?? hero.image

  if (!expandedFeature) return { foreground: productShot }

  switch (expandedFeature.mediaType) {
    // Colour features recolour the stage and keep a picture on it: the overlay, or the product
    case 'color':
      return { foreground: expandedFeature.overlay ?? productShot }
    // A model paints its own canvas; the poster only stands in when there is no renderer
    case 'model':
      if (hasModelRenderer) return null
      return expandedFeature.media.poster ? { background: expandedFeature.media.poster } : null
    // A video paints itself once it can play; until then the plain stage colour shows
    case 'video':
      return null
    case 'image':
      return { background: expandedFeature.media, foreground: expandedFeature.overlay }
  }
}

/** Stage colour for the current state */
export function stageBackgroundFor(
  visualConfig: ProductViewerVisualConfig,
  selectedVariant: ProductViewerVariant | undefined,
  expandedFeature: ProductViewerFeature | null
): string {
  const fallback = visualConfig.container.backgroundColor
  // A colour feature IS the background
  if (expandedFeature?.mediaType === 'color') return safeCssColor(expandedFeature.media.color, fallback)
  if (visualConfig.container.dynamicBackground && selectedVariant && !expandedFeature) {
    return safeCssColor(selectedVariant.backgroundColor, fallback)
  }
  return fallback
}

/**
 * The file a browser would pick for this viewport, mirroring the `<picture>` rules in
 * StageImage. Used to warm the cache ahead of a switch.
 */
export function pickImageSource(image: ResponsiveImage, viewportWidth: number, dpr = 1): string {
  const retina = dpr > 1.5
  if (viewportWidth >= IMAGE_BREAKPOINTS.large) return (retina && image.large2x) || image.large
  if (viewportWidth >= IMAGE_BREAKPOINTS.medium) return (retina && image.medium2x) || image.medium
  return (retina && image.small2x) || image.small
}

/** srcset for one size, with the 2x candidate when the content provides it */
export function srcSetFor(src: string, src2x?: string): string {
  return src2x && src2x !== src ? `${src} 1x, ${src2x} 2x` : src
}

const prefetched = new Set<string>()

/** Fetch an image into the browser cache without rendering it. Idempotent. */
export function prefetchImage(url: string): void {
  if (!url || prefetched.has(url) || typeof Image === 'undefined') return
  prefetched.add(url)
  const img = new Image()
  img.decoding = 'async'
  img.src = url
}

/**
 * Warm the cache with every image the viewer could switch to, once the browser is idle.
 * Skipped when the user has asked to save data.
 */
export function prefetchProductImages(
  hero: ProductViewerHero,
  variants: ProductViewerVariant[],
  features: ProductViewerFeature[]
): () => void {
  if (typeof window === 'undefined') return () => {}
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return () => {}

  const run = () => {
    const width = window.innerWidth
    const dpr = window.devicePixelRatio || 1
    const images: ResponsiveImage[] = [hero.image, ...variants.map((v) => v.image)]
    for (const feature of features) {
      if (feature.mediaType === 'image') images.push(feature.media)
      if (feature.overlay) images.push(feature.overlay)
    }
    for (const image of images) prefetchImage(pickImageSource(image, width, dpr))
  }

  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
    .requestIdleCallback
  if (idle) {
    const handle = idle(run, { timeout: 2000 })
    return () => (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(handle)
  }
  const timer = window.setTimeout(run, 1000)
  return () => window.clearTimeout(timer)
}

/** MIME type for a video URL, so browsers can skip formats they cannot play */
export function videoMimeType(src: string): string | undefined {
  const match = /\.([a-z0-9]+)(?:[?#]|$)/i.exec(src)
  switch (match?.[1]?.toLowerCase()) {
    case 'mp4':
    case 'm4v':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogv':
    case 'ogg':
      return 'video/ogg'
    case 'mov':
      return 'video/quicktime'
    default:
      return undefined
  }
}

/**
 * Content JSON often comes from a CMS. Only plain colour syntax is allowed through to
 * the stylesheet; anything else (or anything that could close a CSS declaration) is dropped.
 */
const CSS_COLOR = /^(#[0-9a-f]{3,8}|(rgb|hsl|hwb|lab|lch|oklab|oklch|color)a?\([^;{}()]*\)|[a-z]{3,20})$/i

export function isCssColor(value: unknown): value is string {
  return typeof value === 'string' && CSS_COLOR.test(value.trim())
}

export function safeCssColor(value: string | undefined, fallback: string): string {
  return isCssColor(value) ? value.trim() : fallback
}

/** Fill in `{placeholder}` tokens of a label template */
export function formatLabel(template: string, values: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}
