/**
 * Dev playground config. publicDir is the package's own examples folder, so the example
 * JSON's asset paths (/media/..., /example.glb) resolve exactly as they will for a consumer
 * who copies examples/media into their public directory.
 *
 * Run from the package root:  npm run dev
 * Device frames (phone / tablet iframes): http://localhost:5199/devices.html
 */
import { fileURLToPath } from 'node:url'

export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(new URL('../examples', import.meta.url)),
  server: { port: 5199, strictPort: true },
}
