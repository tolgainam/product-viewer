/** The viewer on its own, used by the device frames and as a plain demo. Not part of the package. */
import { createRoot } from 'react-dom/client'
import { ProductViewer } from '../src'
// 3D is opt-in: importing the model entry is what pulls in three.js
import { ModelViewer } from '../src/model'
import { data } from './data'

createRoot(document.getElementById('root')!).render(<ProductViewer data={data} modelRenderer={ModelViewer} />)
