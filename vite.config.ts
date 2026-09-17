/**
 * Build config — ESM library bundle; every peer dependency stays external.
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

/**
 * Peers are never bundled. three and @react-three/* are OPTIONAL peers used only by the
 * lazily-loaded 3D scene, so they must stay external too — otherwise a 2D-only install
 * would pull three.js into the main chunk.
 */
const isExternal = (id: string) =>
  /^(react|react-dom|@mui|@emotion|framer-motion|three|@react-three)($|\/)/.test(id)

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      // Two entries: the main one never references three.js; importing "./model" is what
      // pulls it in, so apps without 3D features neither install nor bundle it.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        model: resolve(__dirname, 'src/model.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: { external: isExternal },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
