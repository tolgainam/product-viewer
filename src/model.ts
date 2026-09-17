/**
 * `@tolgainam/product-viewer/model` — the opt-in 3D entry point.
 *
 * Importing this module is what pulls in three, @react-three/fiber and @react-three/drei.
 * The main entry never references them, so an app that shows no 3D neither installs nor
 * bundles three.js. Wire it up by passing the renderer to the viewer:
 *
 * ```tsx
 * import { ProductViewer } from '@tolgainam/product-viewer'
 * import { ModelViewer } from '@tolgainam/product-viewer/model'
 *
 * <ProductViewer data={data} modelRenderer={ModelViewer} />
 * ```
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

export { ModelViewer } from './internal/ModelViewer'
export type { ModelViewerProps } from './internal/ModelViewer'
export type { ModelRenderer, ModelRendererProps } from './ProductViewer.types'
