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
export default {
  root: new URL('.', import.meta.url).pathname,
  publicDir: new URL('../examples', import.meta.url).pathname,
  base: '/product-viewer/',
  build: {
    outDir: new URL('../docs/dist', import.meta.url).pathname,
    emptyOutDir: true,
  },
}
