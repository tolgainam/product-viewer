/** Documentation site entry — built against the real source so it cannot drift from the package. */
import { createRoot } from 'react-dom/client'
import { DocsApp } from './docs/DocsApp'

createRoot(document.getElementById('root')!).render(<DocsApp />)
