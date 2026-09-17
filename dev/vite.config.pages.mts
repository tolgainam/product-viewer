/**
 * Build config for the GitHub Pages demo.
 *
 * Same entry as the local playground, with two differences: `base` matches the
 * project Pages path (tolgainam.github.io/product-viewer/), and the build writes
 * to docs/dist, which the Demo workflow uploads as the Pages artifact.
 *
 * publicDir stays pointed at examples/, so the demo serves the same generated
 * assets a consumer copies into their own public directory.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { fileURLToPath } from 'node:url'

export default {
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: fileURLToPath(new URL('../examples', import.meta.url)),
  base: '/product-viewer/',
  build: {
    outDir: fileURLToPath(new URL('../docs/dist', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      // framer-motion and lucide ship "use client" directives meant for React Server
      // Components; Rollup drops them in a client bundle, which is fine and not worth a line each
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      },
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        demo: fileURLToPath(new URL('./demo.html', import.meta.url)),
        devices: fileURLToPath(new URL('./devices.html', import.meta.url)),
      },
    },
  },
}
