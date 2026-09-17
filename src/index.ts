/**
 * @tolgainam/product-viewer — public entry point.
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

export { ProductViewer } from './ProductViewer'

export {
  defaultConfig,
  liquidGlassConfig,
  transparentBlueConfig,
  lightConfig,
  dynamicBackgroundConfig,
} from './ProductViewerConfig'

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
  ResponsiveImage,
  ResponsiveVideo,
  ProductViewerColor,
  ProductViewerModel,
  ModelRenderer,
  ModelRendererProps,
} from './ProductViewer.types'
