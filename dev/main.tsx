/** Local playground for manual testing — not part of the published package. */
import { createRoot } from 'react-dom/client'
import { ProductViewer } from '../src'
// 3D is opt-in: importing the model entry is what pulls in three.js
import { ModelViewer } from '../src/model'
import data from '../examples/example-product.json'
import type { ProductViewerData } from '../src/ProductViewer.types'

createRoot(document.getElementById('root')!).render(
  <ProductViewer data={data as ProductViewerData} modelRenderer={ModelViewer} />
)
