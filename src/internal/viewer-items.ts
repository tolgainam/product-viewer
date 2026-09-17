/**
 * The list the pills render: an optional colour item followed by the features.
 * Shared by both layouts and by the keyboard/chevron navigation in ProductViewer.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import type {
  ModelRenderer,
  ProductViewerFeature,
  ProductViewerHero,
  ProductViewerLabels,
  ProductViewerVariant,
  ProductViewerVisualConfig,
} from '../ProductViewer.types'

/** Index used for the colour selector in `expandedFeatureIndex` */
export const COLOR_ITEM_INDEX = -2 as const

export type ViewerItem =
  | { type: 'color'; id: 'colors'; index: typeof COLOR_ITEM_INDEX }
  | { type: 'feature'; id: string; index: number; feature: ProductViewerFeature }

export function buildViewerItems(variants: ProductViewerVariant[], features: ProductViewerFeature[]): ViewerItem[] {
  return [
    ...(variants.length > 1 ? [{ type: 'color' as const, id: 'colors' as const, index: COLOR_ITEM_INDEX } satisfies ViewerItem] : []),
    ...features.map((feature, index) => ({ type: 'feature' as const, id: feature.id, index, feature })),
  ]
}

/** A colour string, or per-state colours; normalised to per-state */
export function stateColors<T extends Record<string, string>>(value: string | T, keys: (keyof T)[]): T {
  if (typeof value !== 'string') return value
  return Object.fromEntries(keys.map((key) => [key, value])) as T
}

/** Props both layouts receive from ProductViewer */
export interface ProductViewerLayoutProps {
  hero: ProductViewerHero
  variants: ProductViewerVariant[]
  features: ProductViewerFeature[]
  items: ViewerItem[]
  selectedVariantId: string
  /** -1 none, -2 colour selector, 0+ a feature */
  expandedFeatureIndex: number
  /** Position of the active item in `items`, or -1 */
  activeItemIndex: number
  canGoPrevious: boolean
  canGoNext: boolean
  onVariantChange: (variantId: string) => void
  /** Open the item with this index, or close it if it is already open */
  onFeatureToggle: (index: number) => void
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
  visualConfig: ProductViewerVisualConfig
  labels: ProductViewerLabels
  /** Supplied by the host app from '@tolgainam/product-viewer/model'; absent means no 3D */
  modelRenderer?: ModelRenderer
}
