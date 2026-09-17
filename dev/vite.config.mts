/**
 * Dev playground config. publicDir is the package's own examples folder, so the example
 * JSON's asset paths (/media/..., /prime.glb) resolve exactly as they will for a consumer
 * who copies examples/media into their public directory.
 *
 * Run from the package root:  npx vite dev --config dev/vite.config.mts
 */
export default {
  root: new URL('.', import.meta.url).pathname,
  publicDir: new URL('../examples', import.meta.url).pathname,
  server: { port: 5199, strictPort: true },
}
