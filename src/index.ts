/**
 * @tolgainam/product-viewer — public entry point.
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

export { ProductViewer, DEFAULT_BREAKPOINT } from './ProductViewer'

export { defaultConfig, liquidGlassConfig, transparentBlueConfig } from './ProductViewerConfig'

export { defaultLabels } from './internal/labels'

export {
  palette,
  colors,
  typography,
  spacing,
  borderRadius,
  getSpacingPx,
} from './palette'

export type {
  ProductViewerProps,
  ProductViewerData,
  ProductViewerVisualConfig,
  ProductViewerHero,
  ProductViewerVariant,
  ProductViewerFeature,
  ProductViewerFeatureBase,
  ProductViewerMediaType,
  ProductViewerLabels,
  ProductViewerLayout,
  ResponsiveImage,
  ResponsiveVideo,
  ProductViewerColor,
  ProductViewerModel,
  ModelRenderer,
  ModelRendererProps,
} from './ProductViewer.types'
