/// <reference types="vite/client" />
/**
 * The example content with every media URL resolved against Vite's base path.
 *
 * The JSON uses root-absolute paths (`/media/...`), which is what a consumer copying
 * `examples/media` into their public directory gets. The docs site is served from
 * `/product-viewer/` on GitHub Pages, so those paths need the base prefixed.
 */
import example from '../examples/example-product.json'
import type { ProductViewerData, ProductViewerFeature, ResponsiveImage } from '../src'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

const url = (path: string) => (path.startsWith('/') ? `${base}${path}` : path)

const image = (img: ResponsiveImage): ResponsiveImage => ({
  ...img,
  small: url(img.small),
  medium: url(img.medium),
  large: url(img.large),
  ...(img.small2x && { small2x: url(img.small2x) }),
  ...(img.medium2x && { medium2x: url(img.medium2x) }),
  ...(img.large2x && { large2x: url(img.large2x) }),
})

const feature = (f: ProductViewerFeature): ProductViewerFeature => {
  const overlay = f.overlay ? { overlay: image(f.overlay) } : {}
  switch (f.mediaType) {
    case 'image':
      return { ...f, ...overlay, media: image(f.media) }
    case 'video':
      return { ...f, ...overlay, media: { ...f.media, src: url(f.media.src), ...(f.media.poster && { poster: image(f.media.poster) }) } }
    case 'model':
      return { ...f, ...overlay, media: { ...f.media, src: url(f.media.src), ...(f.media.poster && { poster: image(f.media.poster) }) } }
    case 'color':
      return { ...f, ...overlay }
  }
}

const source = example as ProductViewerData

export const data: ProductViewerData = {
  ...source,
  hero: { ...source.hero, image: image(source.hero.image), ...(source.hero.video && { video: { ...source.hero.video, src: url(source.hero.video.src) } }) },
  variants: source.variants.map((v) => ({ ...v, image: image(v.image) })),
  features: source.features.map(feature),
}
